
const mongoose = require("mongoose");

const PdfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "employees",
    required: true,
  },
  title: {
    type: String, // Assuming title is a string
    required: true,
  },
  pdfPath: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const PdfModel = mongoose.model("pdfs", PdfSchema);
module.exports = PdfModel;
