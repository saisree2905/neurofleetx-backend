require('dotenv').config();   // load .env
const express = require("express");
const connectDB = require("./config/db");

const app = express();
app.use(express.json());

// 1️⃣ Connect to MongoDB
connectDB();

// 2️⃣ Example API route
app.get("/", (req, res) => {
  res.send("API is running");
});


// Routes
app.use("/api", require("./src/routes/userRoutes"));


// 3️⃣ Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




