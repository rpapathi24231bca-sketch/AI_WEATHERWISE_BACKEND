// config/db.js
// Handles the connection to MongoDB using Mongoose.

const mongoose = require('mongoose');

// This is an async function because connecting to a database
// takes time and we need to wait for it to finish (or fail).
const connectDB = async () => {
  try {
    // mongoose.connect() reads the connection string and attempts to connect.
    // We never log the raw URI, since it contains a username/password.
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If the connection fails, log a clear error message and stop the app.
    // There's no point running an API that can't reach its database.
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
