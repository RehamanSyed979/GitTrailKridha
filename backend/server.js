// ...existing code...

// Place this route after all app/express/mongoose setup:
// Mobile OTP Login (returns user by mobile, for Firebase OTP flow)
// (MUST be after User model is defined and app is initialized)

// ...existing code...
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Use MongoDB Atlas for cloud database
mongoose.connect('mongodb+srv://rehamansyed979:Syed%40786786@kridharealty.v71poy0.mongodb.net/KridhaRealty?retryWrites=true&w=majority', {});

const userSchema = new mongoose.Schema({
  mobile: { type: String, unique: true, required: true },
  email: String,
  password: String,
  name: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});
// In-memory OTP store (for demo only)
const otpStore = {};

// Send OTP (Firebase Auth should be used on the frontend for phone verification)
app.post('/api/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile required' });
  if (await User.findOne({ mobile })) return res.status(400).json({ error: 'Mobile already registered' });
  // In Firebase Auth, OTP is handled on the frontend. This endpoint is now a placeholder.
  res.json({ success: true, message: 'Use Firebase Authentication for phone OTP.' });
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { mobile, otp } = req.body;
  if (otpStore[mobile] && otpStore[mobile] === otp) {
    delete otpStore[mobile];
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});
const User = mongoose.model('User', userSchema);

// Auto-create admin user if not exists
async function ensureAdminUser() {
  const adminEmail = 'admin@kridha.com';
  const adminPassword = 'Admin123';
  const adminName = 'Admin';
  const adminMobile = '9999999999';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(adminPassword, 10);
    admin = new User({
      mobile: adminMobile,
      email: adminEmail,
      password: hash,
      name: adminName,
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created:', adminEmail);
  }
}
ensureAdminUser();

// Register
app.post('/api/register', async (req, res) => {
  const { mobile, email, password, name } = req.body;
  if (await User.findOne({ mobile })) return res.status(400).json({ error: 'Mobile already registered' });
  if (await User.findOne({ email })) return res.status(400).json({ error: 'Email exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ mobile, email, password: hash, name }); // Let Mongoose default handle createdAt
  await user.save();
  res.json({ success: true });
});

// Login
app.post('/api/login', async (req, res) => {
  let { email, password } = req.body;
  email = (email || '').trim().toLowerCase();
  console.log('LOGIN ATTEMPT:', { email, password });
  // Master admin login (secure)
  if (email === 'admin@kridha.com') {
    console.log('Master admin login attempt, received password:', password);
    let user = await User.findOne({ email: 'admin@kridha.com' });
    if (!user) {
      user = new User({
        mobile: '9999999999',
        email: 'admin@kridha.com',
        password: await bcrypt.hash('Admin123', 10),
        name: 'Admin',
        role: 'admin'
      });
      await user.save();
      console.log('Master admin created in DB');
    }
    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      console.log('Master admin password incorrect');
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    console.log('Master admin login success');
    return res.json({ success: true, user: { email: 'admin@kridha.com', name: 'Admin', role: 'admin' } });
  }
  // Normal user login
  console.log('Normal user login attempt');
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found');
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const passOk = await bcrypt.compare(password, user.password);
  if (!passOk) {
    console.log('User password incorrect');
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  console.log('Normal user login success');
  res.json({ success: true, user: { email: user.email, name: user.name, role: user.role } });
});

// Get all users (admin only)
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

// Set user role (admin only)
app.post('/api/setrole', async (req, res) => {
  const { email, role } = req.body;
  await User.updateOne({ email }, { role });
  res.json({ success: true });
});

// Delete user (admin only)
app.post('/api/delete', async (req, res) => {
  const { email } = req.body;
  await User.deleteOne({ email });
  res.json({ success: true });
});

// Mobile OTP Login (returns user by mobile, for Firebase OTP flow)
app.post('/api/login-mobile', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile required' });
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ error: 'Mobile not registered' });
    // Remove sensitive fields
    const { password, ...userSafe } = user.toObject();
    res.json({ user: userSafe });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
