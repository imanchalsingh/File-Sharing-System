import mongoose from "mongoose";

const connectDB = () => {
  mongoose.connect(process.env.MONGODB_URI);
};

export default connectDB;
