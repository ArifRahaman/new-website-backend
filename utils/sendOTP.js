const nodemailer = require("nodemailer");
require("dotenv").config();
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD);
async function sendOTPEmail(userEmail, otp) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.GMAIL_USER,
      to: userEmail,
      subject: "Your OTP Code - Ready for Action!",
      text: `Hey ! 🎉\n\nYour exclusive OTP code is: ${otp} 🛡️\n\nUse it to unlock your next step, but remember: this code is only valid for the next 5 minutes! ⏰\n\nIf you didn't request this, feel free to ignore this message or get in touch. Stay awesome! 😎\n\nCheers,\nYour Friendly App Team`
    };
    

    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
}

module.exports = sendOTPEmail;






