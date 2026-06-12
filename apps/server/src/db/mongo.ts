import mongoose from "mongoose";

export const connectMongo = async (): Promise<typeof mongoose> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  console.log("Connecting to MongoDB...");
  const connection = await mongoose.connect(uri);
  console.log("MongoDB connected");

  return connection;
};
