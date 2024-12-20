import { Router } from "express";
import Order from "../models/Order";
import { broadcastTrade, notifyClient, notifyManagers } from "../websocket";
const router = Router();
// Create a new order
router.post("/api/orders", async (req, res) => {
    const { asset, quantity, price, expiration, type, userId } = req.body;
    try {
        const order = new Order({
            asset,
            quantity,
            price,
            expiration,
            type,
            userId,
            status: "ACTIVE",
        });
        await order.save();
        res.status(201).json(order);
        notifyManagers({ type: "NEW_ORDER", order });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create order" });
    }
});
// Manager fetch match opportunities
router.get("/api/match-opportunities", async (req, res) => {
    try {
        const buyOrders = await Order.find({ status: "ACTIVE", type: "BUY" });
        const sellOrders = await Order.find({ status: "ACTIVE", type: "SELL" });
        res.status(200).json({ buyOrders, sellOrders });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch match opportunities" });
    }
});
// Manager match orders
router.post("/api/match-orders", async (req, res) => {
    const { buyOrderId, sellOrderId } = req.body;
    try {
        const buyOrder = await Order.findById(buyOrderId);
        const sellOrder = await Order.findById(sellOrderId);
        if (!buyOrder ||
            !sellOrder ||
            buyOrder.status !== "ACTIVE" ||
            sellOrder.status !== "ACTIVE") {
            res.status(400).json({ error: "Invalid or inactive orders" });
            return;
        }
        if (buyOrder.price < sellOrder.price) {
            res
                .status(400)
                .json({ error: "Buy order price is lower than sell order price" });
            return;
        }
        const matchedQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
        buyOrder.quantity -= matchedQuantity;
        sellOrder.quantity -= matchedQuantity;
        if (buyOrder.quantity === 0) {
            buyOrder.status = "FILLED";
            await buyOrder.save();
        }
        if (sellOrder.quantity === 0) {
            sellOrder.status = "FILLED";
            await sellOrder.save();
        }
        // Notify clients of the match
        broadcastTrade(buyOrder, sellOrder, matchedQuantity);
        res.status(200).json({
            message: "Orders matched successfully",
            matchedQuantity,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to match orders" });
    }
});
// Manager rejects an order
router.post("/api/reject-order", async (req, res) => {
    const { orderId } = req.body;
    try {
        const order = await Order.findById(orderId);
        if (!order || order.status !== "ACTIVE") {
            res.status(400).json({ error: "Invalid or inactive order" });
            return;
        }
        order.status = "REJECTED";
        await order.save();
        // Notify the client who placed the order
        notifyClient(order.userId.toString(), { type: "ORDER_REJECTED", order });
        res.status(200).json({ message: "Order rejected successfully", order });
    }
    catch (error) {
        console.error("Failed to reject order:", error);
        res.status(500).json({ error: "Failed to reject order" });
    }
});
export { router as adminRouter };
