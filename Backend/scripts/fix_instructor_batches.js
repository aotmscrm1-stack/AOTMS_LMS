const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const { Batch, StudentBatch } = require('../models/Batch');
const { Course } = require('../models/Course');
const { User, Profile } = require('../models/User');

async function fixInstructorBatches() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        console.log("Connected to MongoDB.");

        const krishnaIdStr = '6a9fcd89f938355e4acf8064';
        const krishnaId = new mongoose.Types.ObjectId(krishnaIdStr);
        const crtCourseId = new mongoose.Types.ObjectId('6aa245d7138c7ab8dde8d543');

        // 1. Convert any string instructor_id in batches to ObjectId
        const batches = await db.collection('batches').find({}).toArray();
        let convertedCount = 0;

        for (const b of batches) {
            let needsUpdate = false;
            const updateDoc = {};

            if (typeof b.instructor_id === 'string' && mongoose.isValidObjectId(b.instructor_id)) {
                updateDoc.instructor_id = new mongoose.Types.ObjectId(b.instructor_id);
                needsUpdate = true;
            }
            if (typeof b.instructor === 'string' && mongoose.isValidObjectId(b.instructor)) {
                updateDoc.instructor = new mongoose.Types.ObjectId(b.instructor);
                needsUpdate = true;
            }
            if (typeof b.course_id === 'string' && mongoose.isValidObjectId(b.course_id)) {
                updateDoc.course_id = new mongoose.Types.ObjectId(b.course_id);
                needsUpdate = true;
            }

            if (needsUpdate) {
                await db.collection('batches').updateOne({ _id: b._id }, { $set: updateDoc });
                convertedCount++;
                console.log(`Converted batch '${b.batch_name}' (${b._id}) to ObjectIds.`);
            }
        }
        console.log(`Total batches converted: ${convertedCount}`);

        // 2. Ensure CRT Course has krishnaId as ObjectId
        const crtCourse = await db.collection('courses').findOne({ _id: crtCourseId });
        if (crtCourse) {
            const cleanInstructorIds = (crtCourse.instructor_ids || [])
                .map(id => id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id.toString()))
                .filter(id => id.toString() !== '6a3921eece2748225fbf1afb'); // remove Saadiya

            if (!cleanInstructorIds.some(id => id.toString() === krishnaIdStr)) {
                cleanInstructorIds.push(krishnaId);
            }

            await db.collection('courses').updateOne(
                { _id: crtCourseId },
                { $set: { instructor_ids: cleanInstructorIds, updated_at: new Date() } }
            );
            console.log("Updated CRT Course instructor_ids with Krishna Shruthi.");
        }

        // 3. Test with Mongoose queries exactly as server.js runs them:
        console.log("\n=== Testing Mongoose Queries ===");

        // Query 1: Instructor courses
        const myCourses = await Course.find({
            $or: [
                { instructor_id: krishnaIdStr },
                { instructor_ids: krishnaIdStr }
            ]
        }).lean();
        console.log(`Instructor courses found: ${myCourses.length}`);
        myCourses.forEach(c => console.log(`  Course: ${c.title} (${c._id})`));

        // Query 2: Instructor batches for those courses
        const myBatches = await Batch.find({
            course_id: { $in: myCourses.map(c => c._id) },
            instructor_id: krishnaIdStr
        }).lean();
        console.log(`Instructor batches found: ${myBatches.length}`);
        myBatches.forEach(b => console.log(`  Batch: ${b.batch_name} (${b._id}), type: ${b.batch_type}, status: ${b.status}`));

        // Query 3: Students in those batches
        const myBatchIds = myBatches.map(b => b._id);
        const studentAssignments = await StudentBatch.find({ batch_id: { $in: myBatchIds } })
            .populate('student_id', 'full_name email')
            .lean();
        console.log(`Students found in batches: ${studentAssignments.length}`);
        if (studentAssignments.length > 0) {
            console.log(`Sample student:`, {
                id: studentAssignments[0]._id,
                batch_id: studentAssignments[0].batch_id,
                student_name: studentAssignments[0].student_id?.full_name,
                student_email: studentAssignments[0].student_id?.email
            });
        }

        // Query 4: Roster query simulation (/api/courses/:courseId/roster)
        const myBatchesRoster = await Batch.find({
            course_id: crtCourseId,
            instructor_id: krishnaIdStr
        }).select('_id').lean();
        const rosterBatchIds = myBatchesRoster.map(b => b._id);
        const rosterAssignments = await StudentBatch.find({
            batch_id: { $in: rosterBatchIds }
        }).select('student_id').lean();
        console.log(`Roster query students found for CRT Course: ${rosterAssignments.length}`);

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

fixInstructorBatches();
