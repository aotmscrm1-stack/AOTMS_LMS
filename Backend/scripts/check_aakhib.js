const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkAakhib() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const aakhibId = new mongoose.Types.ObjectId('6a9fccd1f938355e4acf7b79');
        const user = await mongoose.connection.db.collection('users').findOne({ _id: aakhibId });
        console.log("Aakhib user:", user ? { email: user.email, name: user.full_name } : "Not found");

        const aakhibBatches = await mongoose.connection.db.collection('batches').find({ instructor_id: aakhibId }).toArray();
        console.log("Aakhib batches:", aakhibBatches.map(b => ({ id: b._id, name: b.batch_name })));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkAakhib();
