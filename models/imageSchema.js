const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
    profileImage: {
      type: String,
      required: true, // Ensure the URL or file path is provided
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees", // Reference to the Employee model
      required: true, // Ensure the employee ID is provided
    },
    createdAt: {
      type: Date,
      default: Date.now, // Automatically set the date when the image is created
    },
  });
  const ImageModel = mongoose.model("images", ImageSchema);
   module.exports = ImageModel;