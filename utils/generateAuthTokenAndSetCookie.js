const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const generateAuthTokenAndSetCookie = (user, res) => {
  const payload = {
    _id: user._id,
    username: user.username,
    email: user.email,
    dob: user.dob,
    universityname: user.universityname,
  };

  const token = jwt.sign(payload, JWT_SECRET_KEY, {
    expiresIn: "6d",
  });
  
  res.cookie("jwt", token, {
    maxAge: 6 * 24 * 60 * 60 * 1000, // 6 days
    httpOnly: true,
    secure: true, // Ensure HTTPS is used
    sameSite: 'None', // Required for cross-site cookies
    // domain: '.backend_pdf-chat.com', // Ensure this matches your domain
  });
  return token;
};

module.exports = generateAuthTokenAndSetCookie;


