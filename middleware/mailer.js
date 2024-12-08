const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: true,
    auth: {
        user: "milandetruja2@gmail.com", //Sender Email Address
        pass: "apnn egyq gfzm zcyl", //App Password for gmail
    },
});

const sendEmail = (to,otp) => {
    const mailOptions = {
        from: {
            name: 'EraBook',
            address: "milandetruja2@gmail.com", //Replace with your email address
        },
        to: to,
        subject: "EraBook OTP Verification",
        text: `Your OTP for EraBook verification is: ${otp}`,
        html: `<p>Your OTP for EraBook verification is: <b>${otp}</b></p>`,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {sendEmail};
