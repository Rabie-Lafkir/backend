import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Consofy Lounge" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Your OTP Verification Code',
    html: `<h2>OTP Code: ${otp}</h2><p>This code expires in 10 minutes.</p>`
  });
};
