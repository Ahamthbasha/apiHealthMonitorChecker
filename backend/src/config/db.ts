import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`);
  } catch (error) {
    throw error;
  }
};

export default connectDB;
