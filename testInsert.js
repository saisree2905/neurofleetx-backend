require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./src/models/user');  // <-- FIXED PATH + LOWERCASE

connectDB();

async function run() {
  await User.create({
    name: "Test User",
    email: "test@gmail.com",
    password: "1234",
    role: "admin"
  });

  console.log("User Inserted Successfully");
  process.exit();
}

run();

