import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GameConsole from './models/Console.js';

dotenv.config();

const consoles = [
  { name: 'PS5 - Station 1', hourlyRate: 20, status: 'free' },
  { name: 'PS5 - Station 2', hourlyRate: 20, status: 'free' },
  { name: 'PS4 - Classic Room', hourlyRate: 15, status: 'free' },
  { name: 'PS5 - VIP Lounge', hourlyRate: 25, status: 'free' },
  { name: 'PS4 - Station 3', hourlyRate: 15, status: 'free' },
  { name: 'PS5 - Station 4', hourlyRate: 20, status: 'free' }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await GameConsole.deleteMany({});
    await GameConsole.insertMany(consoles);
    console.log('✅ Console data seeded successfully.');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    mongoose.disconnect();
  }
};

seedDB();
