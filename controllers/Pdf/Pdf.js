const PdfModel = require("../../models/pdf");

const  uploadPdf= async (req, res) => {
  try {
    const { userId, title } = req.body;
    const pdfPath = req.file.path;
    // Check if the user has an existing PDF
    let existingPdf = await PdfModel.findOne({ userId: userId });
    if (existingPdf) {
      // Create a new version of the PDF
      const newVersionPdf = new PdfModel({
        userId: userId,
        title: title,
        pdfPath: pdfPath,
      });
      await newVersionPdf.save();
      res.status(200).json({
        message: "New version of PDF added successfully",
        pdf: newVersionPdf,
      });
    } else {
      // Create a new PDF entry
      const newPdf = new PdfModel({
        userId: userId,
        title: title,
        pdfPath: pdfPath,
      });
      await newPdf.save();
      res
        .status(201)
        .json({ message: "PDF uploaded successfully", pdf: newPdf });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const deletedPdf=async (req, res) => {
  try {
    const pdf = await PdfModel.findByIdAndDelete(req.params.id);
    if (!pdf) {
      return res.status(404).send({ message: 'PDF not found' });
    }
    res.send({ message: 'PDF deleted successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error deleting PDF' });
  }
};


const getPdf= async (req, res) => {
  const { userId } = req.params;
  try {
    const userPdfs = await PdfModel.find({ userId });
    res.status(200).json(userPdfs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching PDFs", error: error.message });
  }
};


module.exports={
    uploadPdf,deletedPdf,getPdf
};
