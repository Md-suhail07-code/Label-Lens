import nodemailer from "nodemailer"
import 'dotenv/config'

export const sendOtp = async (otp, email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Password reset OTP Code',
        text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`
    }
    await transporter.sendMail(mailOptions)
}