require('dotenv').config();
const { MongoClient } = require('mongodb');

async function check() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('test'); // The default db name might be test or ioc
  
  const historyCol = db.collection('iocuserhistories');
  const count = await historyCol.countDocuments();
  console.log('Total history docs:', count);
  
  if (count > 0) {
    const recent = await historyCol.find().sort({ searched_at: -1 }).limit(1).toArray();
    console.log('Most recent doc:', recent[0]);
  }
  
  await client.close();
}

check().catch(console.error);
