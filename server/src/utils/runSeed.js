import { connectDB, closeDB } from '../config/db.js';
import { seedInitialData } from './seedData.js';

const run = async () => {
  try {
    await connectDB();
    await seedInitialData(true);
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await closeDB();
    process.exit(0);
  }
};

run();
