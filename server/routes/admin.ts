import { Router, Request, Response } from "express";
import Order from "../models/Order";
import { broadcastTrade, broadcastOrderUpdate } from "../websocket";
// import mongoose from "mongoose";

const router = Router();

// Add type definitions
// type DurationUnit = "seconds" | "minutes" | "hours" | "days" | "weeks";

// // Add parseDuration helper
// function parseDuration(duration: string): number {
//   const durationMap: Record<DurationUnit, number> = {
//     seconds: 1000,
//     minutes: 60 * 1000,
//     hours: 60 * 60 * 1000,
//     days: 24 * 60 * 60 * 1000,
//     weeks: 7 * 24 * 60 * 60 * 1000,
//   };

//   const [value, unit] = duration.split(" ");
//   return parseInt(value) * (durationMap[unit as DurationUnit] || 0);
// }

// Accept an order
router.post("/api/accept-order", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    console.log("Accepting order:", orderId);
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "ACCEPTED" },
      { new: true }
    );

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Get updated orders and broadcast
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
  } catch (error) {
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
    const { userId, ...orderData } = req.body;
    console.log("Creating order with userId:", userId);

    const order = new Order({
      ...orderData,
      userId,
      status: "New Order",
      expired: false,
      createdAt: new Date(),
    });

    await order.save();
    console.log("Created order:", order);

    // Get updated orders and broadcast
    const [activeOrders, orderHistory] = await Promise.all([
      Order.find({ status: "New Order" }),
      Order.find({ status: { $ne: "New Order" } })
        .sort({ updatedAt: -1 })
        .limit(50),
    ]);

    console.log("Broadcasting orders:", activeOrders);

    broadcastOrderUpdate({
      type: "ORDER_UPDATE",
      orders: activeOrders,
      orderHistory,
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Simplify to just return orders
router.get("/api/match-opportunities", async (req, res) => {
  try {
    // Add status filter to get only active orders
    const orders = await Order.find({ expired: false });

    const buyOrders = orders.filter(
      (o) => o.type === "BUY" && o.status === "ACCEPTED"
    );
    const sellOrders = orders.filter(
      (o) => o.type === "SELL" && o.status === "ACCEPTED"
    );

    const opportunities = buyOrders
      .flatMap((buyOrder) =>
        sellOrders
          .filter(
            (sellOrder) =>
              buyOrder.price >= sellOrder.price &&
              buyOrder.asset === sellOrder.asset
          )
          .map((sellOrder) => ({
            buyOrder,
            sellOrder,
            potentialProfit:
              (buyOrder.price - sellOrder.price) *
              Math.min(buyOrder.quantity, sellOrder.quantity),
          }))
      )
      .sort((a, b) => b.potentialProfit - a.potentialProfit);

    console.log("Found opportunities:", opportunities);
    res.json(opportunities);
  } catch (error) {
    console.error("Error fetching match opportunities:", error);
    res.status(500).json({ error: "Failed to fetch match opportunities" });
  }
});

// Add a new endpoint for order history
router.get("/api/order-history", async (req, res) => {
  try {
    const orderHistory = await Order.find({ status: { $ne: "New Order" } })
      .sort({ updatedAt: -1 })
      .limit(50);

    console.log("Found order history:", orderHistory);
    res.json(orderHistory);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

// Add this temporary endpoint to check data
router.get("/api/debug/orders", async (req, res) => {
  try {
    const allOrders = await Order.find({});
    console.log("All orders in DB:", allOrders);
    res.json({
      total: allOrders.length,
      orders: allOrders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export { router as adminRouter };
