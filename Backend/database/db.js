import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDb = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}/label-lens`,{
            dbName: "label-lens"
        });
        console.log("MONGO DB connected successfully");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

export default connectDb;