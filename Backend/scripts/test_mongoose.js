const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const { Batch, StudentBatch } = require('../models/Batch');
const Course = require('../models/Course');
const { User } = require('../models/User');

async function testMongooseQueries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const krishnaIdStr = '6a9fcd89f938355e4acf8064';
        const crtCourseId = '6aa245d7138c7ab8dde8d543';

        console.log("=== Testing with Mongoose Batch Model ===");
        // 1. Batch.find({ instructor_id: krishnaIdStr })
        const mBatches = await Batch.find({ instructor_id: krishnaIdStr }).lean();
        console.log(`Batch.find({ instructor_id: '${krishnaIdStr}' }) returned:`, mBatches.length, "batches");

        // 2. Batch.find({ course_id: crtCourseId, instructor_id: krishnaIdStr })
        const mBatches2 = await Batch.find({ course_id: crtCourseId, instructor_id: krishnaIdStr }).lean();
        console.log(`Batch.find({ course_id, instructor_id }) returned:`, mBatches2.length, "batches");

        // 3. Raw MongoDB collection find
        const rawBatchesObjId = await mongoose.connection.db.collection('batches').find({ instructor_id: new mongoose.Types.ObjectId(krishnaIdStr) }).toArray();
        console.log(`Raw DB find({ instructor_id: ObjectId('${krishnaIdStr}') }) returned:`, rawBatchesObjId.length);

        const rawBatchesStr = await mongoose.connection.db.collection('batches').find({ instructor_id: krishnaIdStr }).toArray();
        console.log(`Raw DB find({ instructor_id: '${krishnaIdStr}' }) returned:`, rawBatchesStr.length);

        // 4. Test Roster / StudentBatch query
        console.log("\n=== Testing Roster / Student queries ===");
        const myBatchIds = mBatches.map(b => b._id);
        const students = await StudentBatch.find({ batch_id: { $in: myBatchIds } }).lean();
        console.log(`Students found with Mongoose for Krishna Shruthi: ${students.length}`);

        // What if batch_id is 6aacfd9eb7b0c1b9b0a17d99?
        const batch4thId = new mongoose.Types.ObjectId('6aacfd9eb7b0c1b9b0a17d99');
        const students4th = await StudentBatch.find({ batch_id: batch4thId }).lean();
        console.log(`Students directly in LITAM 4th Year batch: ${students4th.length}`);

        // What if batch_id is 6ab4b4eeb7b0c1b9b0a3c01e?
        const batch3rdId = new mongoose.Types.ObjectId('6ab4b4eeb7b0c1b9b0a3c01e');
        const students3rd = await StudentBatch.find({ batch_id: batch3rdId }).lean();
        console.log(`Students directly in Python Litam 3rd Year batch: ${students3rd.length}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testMongooseQueries();
