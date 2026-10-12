const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkBatchesAndStudents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const krishnaIdStr = '6a9fcd89f938355e4acf8064';
        const krishnaId = new mongoose.Types.ObjectId(krishnaIdStr);
        const crtCourseId = new mongoose.Types.ObjectId('6aa245d7138c7ab8dde8d543');

        console.log("=== Checking CRT Course (6aa245d7138c7ab8dde8d543) ===");
        const course = await db.collection('courses').findOne({ _id: crtCourseId });
        console.log("CRT Course title:", course ? course.title : "NOT FOUND");
        console.log("CRT Course instructor_ids:", course ? course.instructor_ids : "NOT FOUND");
        console.log("Does instructor_ids contain krishnaId (ObjectId)?", course ? course.instructor_ids.some(id => id.toString() === krishnaIdStr) : false);

        console.log("\n=== Checking ALL Batches for CRT Course ===");
        const crtBatches = await db.collection('batches').find({ course_id: crtCourseId }).toArray();
        console.log(`Found ${crtBatches.length} batches for CRT Course:`);
        for (const b of crtBatches) {
            const studentCount = await db.collection('studentbatches').countDocuments({ batch_id: b._id });
            console.log(`\nBatch ID: ${b._id}`);
            console.log(`  Name: ${b.batch_name}`);
            console.log(`  Type: ${b.batch_type}`);
            console.log(`  Status: ${b.status}`);
            console.log(`  Is Active: ${b.is_active}`);
            console.log(`  instructor_id: ${b.instructor_id} (type: ${typeof b.instructor_id}, isObjectId: ${b.instructor_id instanceof mongoose.Types.ObjectId})`);
            console.log(`  instructor: ${b.instructor}`);
            console.log(`  Student count in studentbatches: ${studentCount}`);
        }

        console.log("\n=== Checking ALL Batches where Krishna Shruthi is instructor ===");
        const krishnaBatches = await db.collection('batches').find({
            $or: [
                { instructor_id: krishnaId },
                { instructor_id: krishnaIdStr },
                { instructor: krishnaId },
                { instructor: krishnaIdStr }
            ]
        }).toArray();
        console.log(`Found ${krishnaBatches.length} batches assigned to Krishna Shruthi:`);
        for (const b of krishnaBatches) {
            const studentCount = await db.collection('studentbatches').countDocuments({ batch_id: b._id });
            console.log(`  - ${b._id}: ${b.batch_name} (course: ${b.course_id}, type: ${b.batch_type}, status: ${b.status}, students: ${studentCount})`);
        }

        console.log("\n=== Checking total student assignments in studentbatches for CRT course ===");
        const totalCrtStudents = await db.collection('studentbatches').countDocuments({ course_id: crtCourseId });
        console.log(`Total students assigned to CRT Course in studentbatches: ${totalCrtStudents}`);

        // Breakdown by batch_id
        const batchCounts = await db.collection('studentbatches').aggregate([
            { $match: { course_id: crtCourseId } },
            { $group: { _id: '$batch_id', count: { $sum: 1 } } }
        ]).toArray();
        console.log("Students by batch_id in CRT course:", batchCounts);

        // Check if there are enrollments for CRT course
        const crtEnrollments = await db.collection('enrollments').countDocuments({ course_id: crtCourseId });
        console.log(`Total enrollments for CRT course: ${crtEnrollments}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkBatchesAndStudents();
