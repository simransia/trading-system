import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/trading";

export const connectToMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
    process.exit(1);
  }
});
