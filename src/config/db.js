// src/config/db.js
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('MONGO_URI not set. Skipping MongoDB connection (useful for quick dev without DB).');
    return Promise.resolve();
  }

  // If user accidentally included legacy options in the connection string, remove them.
  // e.g. mongodb://localhost:27017/neurofleetx?useNewUrlParser=true&useUnifiedTopology=true
  const sanitizedUri = uri.replace(/\?(.*)/, (m, q) => {
    // Remove known unsupported options from the query string.
    const params = new URLSearchParams(q);
    params.delete('useNewUrlParser');
    params.delete('useUnifiedTopology');
    params.delete('ssl'); // optional: leave as-is if you need ssl param for Atlas
    const remaining = params.toString();
    return remaining ? `?${remaining}` : '';
  });

  try {
    // Modern mongoose doesn't need legacy flags; pass no driver options here.
    await mongoose.connect(sanitizedUri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // rethrow so startup fails (you can choose to swallow if you prefer)
    throw err;
  }
}

module.exports = connectDB;
