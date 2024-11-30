const nodemailer = require('nodemailer');

// Create a reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use Gmail as the email service
    auth: {
        user: process.env.EMAIL_USER,  // Replace with your email address
        pass: process.env.EMAIL_PASS,  // Replace with your email password (use environment variables for security)
    },
});

// Send email function
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Sender's email address (should match the email you set up)
        to: to, // Receiver's email address
        subject: subject, // Subject of the email
        text: text, // Email content
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
