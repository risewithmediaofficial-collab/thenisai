import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thenisai';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const billCount = await mongoose.connection.db.collection('bills').countDocuments();
  console.log(`Current active bills count: ${billCount}`);

  // Delete all existing bills and deleted bills to make fresh start from AA001
  const resBills = await mongoose.connection.db.collection('bills').deleteMany({});
  console.log(`Deleted ${resBills.deletedCount} bills from active collection.`);

  try {
    const resDeleted = await mongoose.connection.db.collection('deletedbills').deleteMany({});
    console.log(`Deleted ${resDeleted.deletedCount} bills from recycle bin.`);
  } catch (e) {
    console.log('No deletedbills collection or error:', e.message);
  }

  try {
    const resOrders = await mongoose.connection.db.collection('orders').deleteMany({});
    console.log(`Deleted ${resOrders.deletedCount} orders.`);
  } catch (e) {
    console.log('No orders collection or error:', e.message);
  }

  await mongoose.connection.close();
  console.log('Done! All bills cleared. Next bill will start fresh from AA001.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
