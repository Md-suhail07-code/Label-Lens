import { User } from "../models/userModel.js";
import { Session } from "../models/sessionModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyMail } from "../mailer/verifyEmail.js";
import { sendOtp } from "../mailer/sendOtp.js";

export const signUp = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            })
        }
        const hasehdPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            username,
            email,
            password: hasehdPassword,
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
        verifyMail(token, email);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: newUser,
            token
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        })
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token is missing or invalid"
            })
        }

        const token = authHeader.split(" ")[1]; // [Bearer token]
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(400).json({
                    success: false,
                    message: "Token has expired"
                });
            }
            res.status(500).json({
                success: false,
                message: "Email verification failed",
                error: error.message
            })
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        user.isVerified = true;
        user.token = null;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Email verification failed",
            error: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Unauthorized Access"
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }
        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: "Verify Your Email to Login"
            });
        }
        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10d' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        user.isLoggedIn = true;
        await user.save();

        const existingSession = await Session.findOne({ user: user._id });
        if (existingSession) {
            await Session.deleteOne({ user: user._id });
        }

        await Session.create({ user: user._id });

        res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Login failed", error: error.message
        });
    }
}

export const logout = async (req, res) => {
    try {
        const userId = req.userId;
        await Session.deleteMany({ user: userId });
        await User.findByIdAndUpdate(userId, { isLoggedIn: false });
        res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Logout failed", error: error.message
        });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        sendOtp(otp, email);
        return res.status(200).json({
            success: true,
            message: "OTP sent to your email Successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const { email } = req.params;
        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "OTP is required"
            })
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        if (user.otp !== otp || Date.now() > user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP request a new one"
            })
        }
        user.otp = null;
        user.otpExpiry = null;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "OTP verified successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const changePassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const { email } = req.params;
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            })
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        })
    }
}

export const updateUSer = async (req, res) => {
    try {
        const { username, healthCondition, allergies } = req.body;
        
        const userId = req.userId; 

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (username !== undefined) user.username = username;
        if (healthCondition !== undefined) user.healthCondition = healthCondition;
        if (allergies !== undefined) user.allergies = allergies;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}