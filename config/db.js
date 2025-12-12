
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠️  MONGO_URI not set. Skipping MongoDB connection.');
    return;
  }

  // Remove old/unsupported mongoose options from the query part of the URI
  const sanitizedUri = uri.replace(/\?(.*)/, (match, queryString) => {
    const params = new URLSearchParams(queryString);
    params.delete('useNewUrlParser');
    params.delete('useUnifiedTopology');
    const remaining = params.toString();
    return remaining ? `?${remaining}` : '';
  });

  try {
    await mongoose.connect(sanitizedUri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;
