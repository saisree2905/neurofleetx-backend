const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { signAccessToken, signRefreshToken, verifyToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ msg: 'Email already registered' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ name, email, password: hashed, role });
    await user.save();

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(201).json({ user: { id: user._id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ msg: 'refreshToken required' });

    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch (e) {
      return res.status(401).json({ msg: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ msg: 'Invalid refresh token' });

    const found = user.refreshTokens.find(rt => rt.token === refreshToken);
    if (!found) return res.status(401).json({ msg: 'Refresh token not recognized' });

    const newAccess = signAccessToken({ id: user._id, role: user.role });
    const newRefresh = signRefreshToken({ id: user._id });

    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({ token: newRefresh });
    await user.save();

    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ msg: 'refreshToken required' });

    await User.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );

    res.json({ msg: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
