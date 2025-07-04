const express = require("express");

const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const socketIo = require('socket.io');
const WebSocket = require('ws');


const multer = require("multer");
const path = require("path");
require("dotenv").config();
const nodemailer = require('nodemailer');
const http = require("http");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const authController = require("./controllers/Users/user");
const PostModel = require("./models/Post");
const authControllerPdf = require("./controllers/Pdf/Pdf");
const app = express();
const server = http.createServer(app);
const JWT_SECRET = "sdsadwfefefefefeffefadafafafaf";


app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static files
// Middleware
app.use(cookieParser());
app.use(express.json());
const allowedOrigins = [
"https://frontendpartarif.vercel.app", 
];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


mongoose
  .connect(
    process.env.MONGO_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });




app.use("/uploads", express.static("uploads"));
// Models
const EmployeeModel = require("./models/employee");
const PdfModel = require("./models/pdf");
const ImageModel = require("./models/imageSchema");

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/pdfs"); // Specify the folder to save uploaded PDFs
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });
app.delete("/videos/:id/:email", async (req, res) => {
  try {
    // Find the video by ID in MongoDB
    const email = req.params.email;
    if (email != 'arifrahaman26adada0ee6@gmail.com') {
      return res.status(401).send({ message: "Unauthorized" });
    }
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });
    await video.deleteOne();

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
const storageed = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the destination directory for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Specify the file name format
  },
});

const uploaded = multer({ storageed });
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/profileimage"); // Save uploaded files to the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    ); // Generate unique filenames
  },
});

// Multer upload instance
const fileUpload = multer({ storage: fileStorage });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// MongoDB connection URI
//mongodb+srv://arifrahaman2606:NTambC6dzWTscSn1@mernstack.emb8nvx.mongodb.net/PDF
mongoose.connect(process.env.MONGO_URI, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
});

// Define a MongoDB schema for storing video URLs
const VideoSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true },
  name: { type: String, required: true },
});
const Video = mongoose.model('Video', VideoSchema);



// Set up Cloudinary storage for multer
const storages = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'videos',               // Cloudinary folder where videos will be stored
    resource_type: 'video',         // Ensure that Cloudinary treats the file as a video
  },
});
const storageanother = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'files', // Name of the folder in Cloudinary
    resource_type: 'auto', // Let Cloudinary determine the file type (image, video, etc.)
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4'], // Specify allowed formats
  },
});


const uploads = multer({ storage: storages });
const upload_profile_image = multer({ storage: storageanother });

// Set up Express app

app.post('/update-status', async (req, res) => {
  const { email, isOnline } = req.body;

  try {
    // Find the employee by email and update their online status
    const result = await EmployeeModel.findOneAndUpdate(
      { email: email },
      { $set: { isOnline: isOnline } },
      { new: true, upsert: true } // `new: true` returns the updated document, `upsert: true` creates if not found
    );

    if (result) {
      res.status(200).send('Status updated successfully');
    } else {
      res.status(404).send('Employee not found');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).send('Server error');
  }
});

// Upload video to Cloudinary and save video URL to MongoDB
app.post('/upload', uploads.single('file'), async (req, res) => {
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



app.post('/upload_profile_image', upload_profile_image.single('profileImage'), async (req, res) => {
  try {
    const profileImage = req.file.path; // Cloudinary file URL
    const employeeId = req.body.employeeId; // Get the employee ID from the request body

    // Create a new image entry
    const user = EmployeeModel.findById({ _id: employeeId });
    if (user) {
      const result = await EmployeeModel.findOneAndUpdate(
        { _id: employeeId },
        { $set: { profileImage: req.file.path } },
        { new: true, upsert: true } // `new: true` returns the updated document, `upsert: true` creates if not found
      );
    }
    const imageNew = new ImageModel({ profileImage, employeeId });
    await imageNew.save();

    // Optionally, update the Employee to include this image
    await EmployeeModel.findByIdAndUpdate(employeeId, {
      $push: { images: imageNew._id }, // Add the new image ID to the employee's images array
    });

    res.json({ imageNew });
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


app.post('/reset-password', authController.reset_password);



app.post(
  "/upload-profile-image",
  fileUpload.single("profileImage"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const { email } = req.body;
    const filePath = req.file.path;
    const imageUrl = `https://frontendpartarif.onrender.com/${filePath}`;
    // const imageUrl = `https://frontend-pdfchat-2.onrender.com/${filePath}`;

    try {
      const updatedUser = await EmployeeModel.findOneAndUpdate(
        { email },
        { profileImage: imageUrl },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send("User not found.");
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Error updating user profile image:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get("/search", async (req, res) => {
  const { query } = req.query;
  try {
    const users = await EmployeeModel.find({
      $or: [
        { username: { $regex: query, $options: "i" } }, // Case-insensitive search for username
        { email: { $regex: query, $options: "i" } }, // Case-insensitive search for email
        { universityname: { $regex: query, $options: "i" } }, // Case-insensitive search for university name
      ],
    });
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/posts/:postId/like", async (req, res) => {
  const postId = req.params.postId;

  try {
    // Find the post by postId
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Update the likes and reset dislikes if necessary
    if (post.likes === 0) {
      post.likes = 1;
      if (post.dislikes !== 0) {
        post.dislikes = 0;
      }
      await post.save();
    }

    res
      .status(200)
      .json({ message: "Post liked successfully", likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/reset-password/:token", authController.password_reset_link);


app.post("/posts/:postId/dislike", async (req, res) => {
  const postId = req.params.postId;

  try {
    // Find the post by postId
    const post = await PostModel.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Update the dislikes and reset likes if necessary
    if (post.dislikes === 0) {
      post.dislikes = 1;
      if (post.likes !== 0) {
        post.likes = 0;
      }
      await post.save();
      res
        .status(200)
        .json({
          message: "Post disliked successfully",
          dislikes: post.dislikes,
        });
    }

    res
      .status(200)
      .json({ message: "Post disliked successfully", dislikes: post.dislikes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/posts/:postId/comments", async (req, res) => {
  const postId = req.params.postId;
  const { text } = req.body;
  try {
    // Find the post by postId
    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Add the new comment to the post
    post.comments.push({ text });
    await post.save();

    res.status(200).json({
      message: "Comment added successfully",
      comment: post.comments[post.comments.length - 1],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.put("/changepassword", async (req, res) => {
  const { password, id } = req.body;

  try {
    // Find the user by ID
    const user = await EmployeeModel.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while changing the password" });
  }
});
app.post("/register", authController.register);

app.get("/pdfs/:pdfId", async (req, res) => {
  try {
    const { pdfId } = req.params;
    const pdf = await PdfModel.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    // Send the PDF file as a download
    const filePath = path.join(__dirname, pdf.pdfPath);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/posts", upload.single("cover"), async (req, res) => {
  const { title, summary, content, author, authorname, authorprofilepicture } =
    req.body; // Add author to destructuring
  const cover = req.file ? req.file.path : null;

  try {
    const post = new PostModel({
      title,
      summary,
      content,
      cover,
      author,
      authorname,
      authorprofilepicture,
    }); // Include author in the post creation
    await post.save();
    res.status(201).send(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});


app.get("/posts", authController.posts)
app.post("/login", authController.login);
app.post("/verify-otp", authController.verifyotp);

app.get("/posts/by-author/:authorId", async (req, res) => {
  try {
    const authorId = req.params.authorId;
    const posts = await PostModel.find({ author: authorId }).populate(
      "author comments.author"
    );
    res.json(posts); // Ensure this returns an array
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put('/user/:id', async (req, res) => {
  try {
    const updates = req.body;
    // Only allow specific fields
    const allowed = ['username', 'email', 'dob', 'universityname'];
    Object.keys(updates).forEach(key => {
      if (!allowed.includes(key)) delete updates[key];
    });
    const updatedUser = await EmployeeModel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const user = await EmployeeModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});
app.post("/upload-pdf", upload.single("pdf"), authControllerPdf.uploadPdf);
// );
app.get("/user-pdfs/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const userPdfs = await PdfModel.find({ userId });
    res.status(200).json(userPdfs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching PDFs", error: error.message });
  }
});

app.get("/user-pdfs/:userId", authControllerPdf.getPdf);


// app.delete("/posts/delete/:id", async (req, res) => {
//   try {
//     const deletesuccess = await PostModel.findByIdAndDelete(req.params.id);
//     if (deletesuccess) {
//       return res.json(success);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// });
app.delete("/delete-pdf/:id", authControllerPdf.deletedPdf);
// Edit PDF title
app.put("/edit-pdf-title/:id", async (req, res) => {
  try {
    const { title } = req.body;
    const pdf = await PdfModel.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );
    if (!pdf) {
      return res.status(404).send({ message: "PDF not found" });
    }
    res.send({ message: "PDF title updated successfully", pdf });
  } catch (error) {
    res.status(500).send({ message: "Error updating PDF title" });
  }
});

// const upload = multer({ dest: "uploads/" });

// Load Deepgram API key from environment variables

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// server.listen(3001, () => {
//   console.log("Server is running on port 3001");
// });
