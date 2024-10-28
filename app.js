// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const { GridFsStorage } = require('multer-gridfs-storage');
// const Grid = require('gridfs-stream');
// const methodOverride = require('method-override');
// const crypto = require('crypto');
// const path = require('path');
// const cors=require("cors");
// const app = express();
// app.use(methodOverride('_method'));
// app.use(cors())
// // MongoDB connection URI
// const mongoURI = 'mongodb+srv://arifrahaman2606:NTambC6dzWTscSn1@mernstack.emb8nvx.mongodb.net/merug';

// // Create a connection to MongoDB
// const conn = mongoose.createConnection(mongoURI);

// // Init GridFS stream
// let gfs;
// conn.once('open', () => {
//   gfs = Grid(conn.db, mongoose.mongo);
//   gfs.collection('videos');
// });

// // Create a storage engine
// const storage = new GridFsStorage({
//   url: mongoURI,
//   file: (req, file) => {
//     return new Promise((resolve, reject) => {
//       crypto.randomBytes(16, (err, buf) => {
//         if (err) {
//           return reject(err);
//         }
//         const filename = buf.toString('hex') + path.extname(file.originalname);
//         const fileInfo = {
//           filename: filename,
//           bucketName: 'videos', // Collection name in GridFS
//         };
//         resolve(fileInfo);
//       });
//     });
//   },
// });

// const upload = multer({ storage });

// // Upload a video
// app.post('/upload', upload.single('file'), (req, res) => {
//   res.json({ file: req.file });
// });

// // Stream video from GridFS
// app.get('/video/:filename', (req, res) => {
//     gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//       if (!file || file.length === 0) {
//         return res.status(404).json({ err: 'No file exists' });
//       }
  
//       // Stream the video if it's an mp4 file
//       if (file.contentType === 'video/mp4') {
//         const readStream = gfs.createReadStream(file.filename);
//         res.set('Content-Type', file.contentType);
//         readStream.pipe(res);
//       } else {
//         res.status(404).json({ err: 'Not a video' });
//       }
//     });
//   });
  

// const PORT = 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const cors=require("cors");
// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dzakqudwe',   // Replace with your Cloudinary cloud name
  api_key: '596374822562713',         // Replace with your Cloudinary API key
  api_secret: 'BDFaucGZXOOybNDG8LJcqDuxkNA',   // Replace with your Cloudinary API secret
});

// MongoDB connection URI
mongoose.connect('mongodb+srv://arifrahaman2606:NTambC6dzWTscSn1@mernstack.emb8nvx.mongodb.net/PDF', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
});

// Define a MongoDB schema for storing video URLs
const VideoSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true },
  name: { type: String, required: true }, // Add name field
});
const Video = mongoose.model('Video', VideoSchema);

// Set up Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'videos',               // Cloudinary folder where videos will be stored
    resource_type: 'video',         // Ensure that Cloudinary treats the file as a video
  },
});

const upload = multer({ storage });

// Set up Express app
const app = express();
app.use(express.json());
app.use(cors())
// Upload video to Cloudinary and save video URL to MongoDB
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { name } = req.body; // Get video name from the request body
    const videoUrl = req.file.path; // Get video URL from Cloudinary response

    const newVideo = new Video({ videoUrl, name }); // Save both name and URL
    await newVideo.save();

    res.json({ videoUrl, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch stored video URLs and names from MongoDB
app.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find(); // Fetch all video URLs and names from MongoDB
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

