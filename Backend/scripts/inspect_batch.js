const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function inspectBatch() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const b = await mongoose.connection.db.collection('batches').findOne({ _id: new mongoose.Types.ObjectId('6aacfd9eb7b0c1b9b0a17d99') });
        console.log("Full batch document:", JSON.stringify(b, null, 2));

        // Also check studentbatches for this batch:
        const sbSample = await mongoose.connection.db.collection('studentbatches').find({ batch_id: new mongoose.Types.ObjectId('6aacfd9eb7b0c1b9b0a17d99') }).limit(3).toArray();
        console.log("\nSample studentbatch docs for LITAM 4th Years:", JSON.stringify(sbSample, null, 2));

        // Check if batch_id in studentbatches is ObjectId or string
        const sbWithObjId = await mongoose.connection.db.collection('studentbatches').countDocuments({ batch_id: new mongoose.Types.ObjectId('6aacfd9eb7b0c1b9b0a17d99') });
        const sbWithStr = await mongoose.connection.db.collection('studentbatches').countDocuments({ batch_id: '6aacfd9eb7b0c1b9b0a17d99' });
        console.log(`studentbatches count with ObjectId: ${sbWithObjId}, with String: ${sbWithStr}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

inspectBatch();
