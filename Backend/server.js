import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./database/db.js";
import userRoute from "./routes/userRoute.js";
import ocrRoute from "./routes/ocrRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({
    origin: "https://label-lens-wenv.onrender.com",
    credentials: true,
}));

app.use("/api/users", userRoute);
app.use("/api/ocr", ocrRoute);

app.listen(PORT, async () => {
    await connectDb();
    console.log(`Server is running on port ${PORT}`);
});
