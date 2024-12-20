import mongoose, { Document } from "mongoose";

interface IUser extends Document {
  username: string;
  password: string;
  role: string;
}

const userSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "user"], required: true },
});

export default mongoose.model<IUser>("User", userSchema);
