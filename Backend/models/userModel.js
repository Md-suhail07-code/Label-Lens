import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    healthCondition: { type: [String], required: false, default: [] },
    allergies: { type: [String], required: false, default: [] },
    isVerified: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    googleId: {
        type: String,
        default: null,
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);