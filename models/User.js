// models/User.js
// Defines the shape of a "User" document stored in MongoDB.

const mongoose = require('mongoose');

// A schema describes the fields a document has, their types,
// and any validation rules that apply to them.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,       // No two users can share the same email.
      lowercase: true,    // Converts "Test@Example.com" -> "test@example.com".
      trim: true          // Removes leading/trailing spaces.
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false        // Excludes password from query results by default.
    }
  },
  {
    timestamps: true       // Automatically adds and manages createdAt and updatedAt.
  }
);

// Compile the schema into a model. Mongoose will store these documents
// in a MongoDB collection called "users" (it lowercases and pluralizes "User").
const User = mongoose.model('User', userSchema);

module.exports = User;
