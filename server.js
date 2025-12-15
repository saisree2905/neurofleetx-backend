
const express = require('express');
const app = express();

// 1️⃣ Connect to MongoDB
require('dotenv').config();
const connectDB = require("./config/db");

app.use(express.json());

connectDB();

// Routes
app.use("/api/buses", require("./src/routes/buses.js"));
app.use("/api/routes", require("./src/routes/routePath.js"));
app.use("/api/users", require("./src/routes/userRoutes"));

//2️⃣ Example API route
app.get('/test', (req, res) => {
  res.send('Root route works!');
});

// 3️⃣ Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
