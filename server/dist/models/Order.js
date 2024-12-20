import mongoose from "mongoose";
const orderSchema = new mongoose.Schema({
    asset: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    expiration: { type: Date, required: true },
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    status: { type: String, default: "ACTIVE" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});
export default mongoose.model("Order", orderSchema);
