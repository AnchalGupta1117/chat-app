const mongoose = require('mongoose');

async function connectToDatabase(uri) {
  if (!uri) {
    throw new Error('Missing MONGO_URI environment variable');
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
  } catch (err) {
    console.error('Mongo connection error:', err.message);
    throw err;
  }
}

module.exports = connectToDatabase;
