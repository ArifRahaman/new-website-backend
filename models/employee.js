const mongoose = require("mongoose");
const EmployeeSchema = new mongoose.Schema({
  //   name: String,
  //   email: String,
  //   password: String,

  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // basic email validation
  },
  dob: {
    type: Date,
    required: true,
  },
  universityname: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String, // URL or file path of the profile image
  },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: "images" }], // Reference to multiple images


  otp: String,
  otpExpiry: Date,

  // lastActive: { type: Date, default: Date.now } // Timestamp of last activity
});

const EmployeeModel = mongoose.model("employees", EmployeeSchema);
module.exports = EmployeeModel;
