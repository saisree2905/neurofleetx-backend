const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  token: String,
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
  refreshTokens: [RefreshTokenSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
