
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const jwt=require("jsonwebtoken");
const EmployeeModel = require("../../models/employee");
const sendOTPEmail = require("../../utils/sendOTP")
const PostModel = require("../../models/Post");
const generateAuthTokenAndSetCookie = require("../../utils/generateAuthTokenAndSetCookie")
// function generateOTP() {
//   // return crypto.randomBytes(3).toString('hex'); // 6-digit OTP
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }
const JWT_SECRET="sdsadwfefefefefeffefadafafafaf"
const generateOTP = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
  const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now

  user.otp = otp;
  user.otpExpiry = otpExpiry;

  try {
    await user.save();
    console.log(`OTP generated and saved for user: ${user.email}` + "otp:" + `${user.otp}`);
  } catch (err) {
    console.error("Error saving OTP:", err);
    throw new Error("Error saving OTP");
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, dob, universityname } = req.body;

    // Trim and sanitize input
    const trimmedUsername = username?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedUniversity = universityname?.trim();

    // Basic field validation
    if (!trimmedUsername || !trimmedEmail || !password || !dob || !trimmedUniversity) {
      return res.status(400).json({
        success: false,
        message: "All fields (username, email, password, dob, universityname) are required.",
      });
    }

    // Date of birth validation
    const dateOfBirth = new Date(dob);
    if (isNaN(dateOfBirth.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format for Date of Birth.",
      });
    }

    // Check for existing user
    const existingEmployee = await EmployeeModel.findOne({ email: trimmedEmail });
    if (existingEmployee) {
      // Email conflict, do not expose further info
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newEmployee = new EmployeeModel({
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      dob: dateOfBirth,
      universityname: trimmedUniversity,
    });

    await newEmployee.save();

    // Respond with success (don't return password or internal fields)
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
    });

  } catch (err) {
    console.error("Error during user registration:", err.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};




const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await EmployeeModel.findOne({ email });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Generate OTP and save to the user's document
        await generateOTP(user);

        // Send OTP to user's email
        await sendOTPEmail(user.email, user.otp);

        return res.status(200).json({ message: "OTP sent to your email" });
      } else {
        return res.status(401).json({ message: "Incorrect password" });
      }
    } else {
      return res.status(404).json({ message: "No record found" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use another email service like Yahoo, Outlook, etc.
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});
const verifyotp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await EmployeeModel.findOne({ email });
    if (!user) {
      console.error(`User with email ${email} not found`);
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP and check if it has not expired
    if (user.otp === otp && user.otpExpiry > Date.now()) {
      console.log(`OTP verified for user: ${email}`);

      try {
        // Generate token and set it in the cookie
        const token = generateAuthTokenAndSetCookie(user, res);

        // Clear OTP and OTP expiry after successful verification
        user.otp = null;
        user.otpExpiry = null;

        try {
          await user.save();
        } catch (saveError) {
          console.error("Error saving user after OTP verification:", saveError);
          return res.status(500).json({ error: "Error saving user data" });
        }

        // Return the token and user data in the response
        return res.status(200).json({
          message: "OTP verified",
          token,  // Include the generated token
          userId: user._id,
          username: user.username,
        });

      } catch (tokenError) {
        console.error("Error generating auth token:", tokenError);
        return res.status(500).json({ error: "Error generating auth token" });
      }
    } else {
      console.error(`Invalid or expired OTP for user: ${email}`);
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ error: err.message });
  }
}


const reset_password = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await EmployeeModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    // Generate a reset token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Generate the reset link
    const resetLink = `https://frontendpartarif.vercel.app/reset-password/${token}`; // Change to your frontend URL

    // Send email
    await transporter.sendMail({
      from: '"Your App Name" <your-email@gmail.com>',
      to: user.email,
      subject: 'Password Reset Request',
      text: `Click on the following link to reset your password: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password</p>`,
    });

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}

const password_reset_link=async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find the user
    const user = await EmployeeModel.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Invalid or expired token' });
  }
}
const posts = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate("author", "username profileImage") // get profile image from Employee
      .populate("comments.author", "username profileImage") // optional: for comment authors
      .sort({ createdAt: -1 })
      .lean(); // converts Mongoose docs to plain JS objects

    const shaped = posts.map((post) => ({
      ...post,
      authorname: post.author?.username,
      authorprofilepicture: post.author?.profileImage,
      comments: post.comments.map((c) => ({
        ...c,
        authorname: c.author?.username,
        authorprofilepicture: c.author?.profileImage,
      })),
    }));

    res.json(shaped);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



module.exports = {
  register,
  login, verifyotp,
  reset_password,
  password_reset_link,
  posts
};
