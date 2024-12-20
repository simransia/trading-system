import mongoose from "mongoose";

export interface IOrder {
  _id?: mongoose.Types.ObjectId;
  asset: string;
  quantity: number;
  price: number;
  expiration: Date;
  type: "BUY" | "SELL";
  status: "New Order" | "ACCEPTED" | "REJECTED" | "FILLED" | "EXPIRED";
  expired: boolean;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  modifiedAt?: Date;
  modificationHistory?: ModificationHistory[];
}

interface ModificationHistory {
  field: "price" | "quantity" | "expiration"; // Limit to specific fields
  oldValue: number | Date; // These are the only types we modify
  newValue: number | Date;
  timestamp: Date;
}

const orderSchema = new mongoose.Schema<IOrder>({
  asset: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  expiration: { type: Date, required: true },
  type: { type: String, enum: ["BUY", "SELL"], required: true },
  status: {
    type: String,
    enum: ["New Order", "ACCEPTED", "REJECTED", "FILLED", "EXPIRED"],
    default: "New Order",
  },
  expired: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date },
  modificationHistory: [
    {
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed,
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

// Add middleware to update modifiedAt
orderSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.modifiedAt = new Date();
  }
  next();
});

export default mongoose.model<IOrder>("Order", orderSchema);
