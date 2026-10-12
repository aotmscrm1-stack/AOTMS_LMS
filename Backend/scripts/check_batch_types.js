const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkAllBatchesType() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const batches = await mongoose.connection.db.collection('batches').find({}).toArray();

        console.log(`Total batches: ${batches.length}`);
        batches.forEach(b => {
            const isOid = b.instructor_id instanceof mongoose.Types.ObjectId;
            const type = typeof b.instructor_id;
            console.log(`- Batch ${b._id} (${b.batch_name}): instructor_id = ${b.instructor_id} (isObjectId: ${isOid}, type: ${type})`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAllBatchesType();
