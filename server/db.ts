import mongoose from "mongoose";

const MONGO_URI = "mongodb://localhost:27017";

export interface DbConnection {
  connectToMongo: () => Promise<void>;
}

export const connectToMongo = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
};
