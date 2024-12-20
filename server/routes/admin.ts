import { Router, Request, Response } from "express";
import Order from "../models/Order";
import { broadcastTrade, broadcastOrderUpdate } from "../websocket";
import mongoose from "mongoose";

const router = Router();

// Add type definitions
type DurationUnit = "seconds" | "minutes" | "hours" | "days" | "weeks";

// Add parseDuration helper
function parseDuration(duration: string): number {
  const durationMap: Record<DurationUnit, number> = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };

  const [value, unit] = duration.split(" ");
  return parseInt(value) * (durationMap[unit as DurationUnit] || 0);
}

// Accept an order
router.post("/api/accept-order", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "ACCEPTED" },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Broadcast order update
    const [activeOrders, orderHistory] = await Promise.all([
      Order.find({ status: "New Order" }),
      Order.find({ status: { $ne: "New Order" } })
        .sort({ updatedAt: -1 })
        .limit(50),
    ]);

    broadcastOrderUpdate({
      type: "ORDER_UPDATE",
      orders: activeOrders,
      orderHistory,
    });

    res.json({ message: "Order accepted", order });
  } catch (error: unknown) {
    console.error("Failed to accept order:", error);
    res.status(500).json({ error: "Failed to accept order" });
  }
});

// Reject an order
router.post("/api/reject-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "REJECTED" },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Broadcast update
    const [activeOrders, orderHistory] = await Promise.all([
      Order.find({ status: "New Order" }),
      Order.find({ status: { $ne: "New Order" } })
        .sort({ updatedAt: -1 })
        .limit(50),
    ]);

    broadcastOrderUpdate({
      type: "ORDER_UPDATE",
      orders: activeOrders,
      orderHistory,
    });

    res.json({ message: "Order rejected", order });
  } catch (error: unknown) {
    console.error("Failed to reject order:", error);
    res.status(500).json({ error: "Failed to reject order" });
  }
});

// Match orders
router.post("/api/match-orders", async (req, res) => {
  try {
    const { buyOrderId, sellOrderId } = req.body;
    const [buyOrder, sellOrder] = await Promise.all([
      Order.findById(buyOrderId),
      Order.findById(sellOrderId),
    ]);

    if (!buyOrder || !sellOrder) {
      res.status(404).json({ error: "One or both orders not found" });
      return;
    }

    // Calculate matched quantity
    const matchedQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);

    // Update orders
    await Promise.all([
      Order.findByIdAndUpdate(buyOrderId, {
        status: "FILLED",
        quantity: buyOrder.quantity - matchedQuantity,
      }),
      Order.findByIdAndUpdate(sellOrderId, {
        status: "FILLED",
        quantity: sellOrder.quantity - matchedQuantity,
      }),
    ]);

    // Broadcast trade
    broadcastTrade(buyOrder, sellOrder, matchedQuantity);

    res.json({ message: "Orders matched successfully" });
  } catch (error: unknown) {
    console.error("Failed to match orders:", error);
    res.status(500).json({ error: "Failed to match orders" });
  }
});

// Modify order
router.post("/api/modify-order", async (req, res) => {
  try {
    const { orderId, modifications } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Save modification history
    const modificationHistory = Object.entries(modifications).map(
      ([field, newValue]) => ({
        field,
        oldValue: field in order ? order[field as keyof typeof order] : null,
        newValue,
        timestamp: new Date(),
      })
    );

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        ...modifications,
        $push: { modificationHistory: { $each: modificationHistory } },
      },
      { new: true }
    );

    // Broadcast update
    const [activeOrders, orderHistory] = await Promise.all([
      Order.find({ status: "New Order" }),
      Order.find({ status: { $ne: "New Order" } })
        .sort({ updatedAt: -1 })
        .limit(50),
    ]);

    broadcastOrderUpdate({
      type: "ORDER_UPDATE",
      orders: activeOrders,
      orderHistory,
    });

    res.json({ message: "Order modified", order: updatedOrder });
  } catch (error: unknown) {
    console.error("Failed to modify order:", error);
    res.status(500).json({ error: "Failed to modify order" });
  }
});

// Place new order
router.post("/api/orders", async (req: Request, res: Response) => {
  try {
    const {
      asset,
      quantity,
      price,
      expiration,
      type,
      userId,
      durationType,
      durationValue,
    } = req.body;

    let expirationDate: Date;
    if (durationType === "duration" && durationValue) {
      expirationDate = new Date(Date.now() + parseDuration(durationValue));
    } else if (expiration) {
      expirationDate = new Date(expiration);
    } else {
      res.status(400).json({ error: "Invalid expiration parameters" });
      return;
    }

    const order = new Order({
      asset,
      quantity: Number(quantity),
      price: Number(price),
      expiration: expirationDate,
      type,
      userId: new mongoose.Types.ObjectId(userId),
      status: "New Order",
      expired: false,
      createdAt: new Date(),
    });

    await order.save();

    // Broadcast update to all clients
    const [activeOrders, orderHistory] = await Promise.all([
      Order.find({ status: "New Order" }),
      Order.find({ status: { $ne: "New Order" } })
        .sort({ updatedAt: -1 })
        .limit(50),
    ]);

    broadcastOrderUpdate({
      type: "ORDER_UPDATE",
      orders: activeOrders,
      orderHistory,
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error: unknown) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

export { router as adminRouter };
