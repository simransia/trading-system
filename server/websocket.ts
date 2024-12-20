// server/websocket.ts

import { WebSocket } from "ws";
import Order, { IOrder } from "./models/Order";
import mongoose from "mongoose";
import { wss, userConnections } from "./index";

interface BroadcastData {
  type: "ORDER_UPDATE" | "TRADE" | "INITIAL_DATA";
  orders?: IOrder[];
  orderHistory?: IOrder[];
  data?: {
    buyOrderId: mongoose.Types.ObjectId;
    sellOrderId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  };
}

interface NotificationData {
  type: string;
  order?: IOrder;
  data?: {
    quantity?: number;
    price?: number;
    message?: string;
  };
}

const notifyClient = (userId: string, data: NotificationData) => {
  const connection = userConnections.get(userId);
  if (
    connection?.role === "client" &&
    connection.socket.readyState === WebSocket.OPEN
  ) {
    connection.socket.send(JSON.stringify(data));
  }
};

const notifyManagers = (data: NotificationData) => {
  userConnections.forEach((connection) => {
    if (
      connection.role === "manager" &&
      connection.socket.readyState === WebSocket.OPEN
    ) {
      connection.socket.send(JSON.stringify(data));
    }
  });
};

const handleConnection = (ws: WebSocket) => {
  // Handle client messages
  ws.on("message", (message: string) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "IDENTIFY") {
        userConnections.set(data.userId, {
          socket: ws,
          role: data.role,
        });
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
    // Remove client from connections
    for (const [userId, conn] of userConnections.entries()) {
      if (conn.socket === ws) {
        userConnections.delete(userId);
        break;
      }
    }
  });

  // Start simulations if first client
  if (wss.clients.size === 1) {
    startPriceSimulation();
    startOrderSimulation();
  }
};

// Expire orders based on expiration
setInterval(async () => {
  const now = new Date();
  const orders = await Order.find({ status: "New Order" });

  for (const order of orders) {
    const expirationTime =
      typeof order.expiration === "string"
        ? new Date(order.createdAt.getTime() + parseDuration(order.expiration))
        : new Date(order.expiration);

    if (expirationTime < now) {
      order.expired = true;
      await order.save();
    }
  }

  const activeOrders = await Order.find({ status: "New Order" });
  const orderHistory = await Order.find({ status: { $ne: "New Order" } });

  broadcastOrderUpdate({
    type: "ORDER_UPDATE",
    orders: activeOrders,
    orderHistory,
  });
}, 5000);

// Helper function: Parse duration
type DurationUnit = "seconds" | "minutes" | "hours" | "days" | "weeks";

function parseDuration(duration: string) {
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
// Broadcast trade info to clients
const broadcastTrade = (
  buyOrder: IOrder,
  sellOrder: IOrder,
  quantity: number
) => {
  const tradeInfo = {
    type: "TRADE",
    data: {
      buyOrderId: buyOrder._id,
      sellOrderId: sellOrder._id,
      quantity,
      price: sellOrder.price,
    },
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(tradeInfo));
    }
  });
};

const broadcastOrderUpdate = (data: BroadcastData) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Export the WebSocket server and connection handler
export {
  wss,
  handleConnection,
  broadcastTrade,
  broadcastOrderUpdate,
  notifyClient,
  notifyManagers,
  generateSimulatedOrder,
};

let currentPrice = 20000; // Initial BTC price
const PRICE_VOLATILITY = 0.002; // 0.2% price movement

const startPriceSimulation = () => {
  setInterval(() => {
    // Simulate price movement
    const priceChange =
      currentPrice * PRICE_VOLATILITY * (Math.random() * 2 - 1);
    currentPrice += priceChange;

    // Simulate volume
    const volume = Math.random() * 2; // 0-2 BTC volume

    const update = {
      type: "PRICE_UPDATE",
      price: currentPrice,
      volume,
      timestamp: new Date(),
    };

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  }, 1000); // Update every second
};

// Update simulation constants for more realistic values
const SIMULATION_CONFIG = {
  INITIAL_PRICE: 45000, // Current BTC price range
  PRICE_VOLATILITY: 0.001, // 0.1% price movement
  ORDER_INTERVAL: 5000, // Generate orders every 5 seconds
  MIN_ORDER_SIZE: 0.001, // Minimum order size (BTC)
  MAX_ORDER_SIZE: 1.0, // Maximum order size (BTC)
  PRICE_SPREAD: 0.002, // 0.2% spread
};

// Add order simulation
const startOrderSimulation = () => {
  setInterval(() => {
    const newOrder = generateSimulatedOrder();
    const expiration = generateRandomExpiration();

    // Create and save order to database with required fields
    const order = new Order({
      ...newOrder,
      status: "New Order",
      userId: new mongoose.Types.ObjectId(), // Add dummy userId for simulation
      expiration:
        typeof expiration === "string"
          ? new Date(Date.now() + parseDuration(expiration))
          : expiration,
    });

    order
      .save()
      .then(() => {
        updateOrderBooks();
      })
      .catch((error) => {
        console.error("Failed to save order:", error);
      });
  }, SIMULATION_CONFIG.ORDER_INTERVAL);
};

// Improve order generation
const generateSimulatedOrder = () => {
  const priceChange =
    currentPrice * SIMULATION_CONFIG.PRICE_VOLATILITY * (Math.random() * 2 - 1);
  currentPrice += priceChange;

  const type = Math.random() > 0.5 ? "BUY" : "SELL";
  const quantity = (
    SIMULATION_CONFIG.MIN_ORDER_SIZE +
    Math.random() *
      (SIMULATION_CONFIG.MAX_ORDER_SIZE - SIMULATION_CONFIG.MIN_ORDER_SIZE)
  ).toFixed(6);

  const spread = currentPrice * SIMULATION_CONFIG.PRICE_SPREAD;
  const price = (currentPrice + (type === "BUY" ? -spread : spread)).toFixed(2);

  return {
    asset: "BTC-USDT",
    quantity: parseFloat(quantity),
    price: parseFloat(price),
    type,
  };
};

// Add expiration generation
const generateRandomExpiration = () => {
  const types = ["duration", "datetime"];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === "duration") {
    const units: DurationUnit[] = ["minutes", "hours", "days"];
    const unit = units[Math.floor(Math.random() * units.length)];
    const value = Math.floor(Math.random() * 10) + 1;
    return `${value} ${unit}`;
  } else {
    const future = new Date();
    future.setHours(future.getHours() + Math.floor(Math.random() * 24));
    return future;
  }
};

// Update the function to remove match finding
const updateOrderBooks = async () => {
  try {
    const [activeOrders, orderHistory] = await Promise.all([
      Order.find({ status: "New Order" }),
      Order.find({ status: { $ne: "New Order" } })
        .sort({ updatedAt: -1 })
        .limit(50),
    ]);

    const update: BroadcastData = {
      type: "ORDER_UPDATE" as const,
      orders: activeOrders,
      orderHistory,
    };

    broadcastOrderUpdate(update);
  } catch (error) {
    console.error("Error updating order books:", error);
  }
};
