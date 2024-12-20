// server/websocket.ts
import { WebSocket } from "ws";
import Order from "./models/Order";
import { wss, userConnections } from "./index";
const notifyClient = (userId, data) => {
    const connection = userConnections.get(userId);
    if (connection?.role === "client" &&
        connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(JSON.stringify(data));
    }
};
const notifyManagers = (data) => {
    userConnections.forEach((connection) => {
        if (connection.role === "manager" &&
            connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.send(JSON.stringify(data));
        }
    });
};
const handleConnection = (ws) => {
    console.log("Client connected");
    // Simulate new orders every 5 seconds
    const orderSimulationInterval = setInterval(async () => {
        try {
            const randomType = Math.random() > 0.5 ? "BUY" : "SELL";
            const randomPrice = (20000 + Math.random() * 1000).toFixed(2);
            const randomQuantity = (0.01 + Math.random() * 0.5).toFixed(4);
            const order = {
                asset: "BTC-USDT",
                quantity: parseFloat(randomQuantity),
                price: parseFloat(randomPrice),
                expiration: "1 minute",
                type: randomType,
                userId: "system",
                status: "ACTIVE",
            };
            // Broadcast the order to all connected clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: "ORDER_UPDATE", orders: [order] }));
                }
            });
        }
        catch (error) {
            console.error("Error generating simulated orders:", error);
        }
    }, 5000);
    ws.on("message", (message) => {
        const data = JSON.parse(message.toString());
        if (data.type === "IDENTIFY") {
            const { userId, role } = data; // role: "manager" or "client"
            userConnections.set(userId, { role, socket: ws });
            console.log(`User ${userId} connected as ${role}`);
        }
    });
    ws.on("close", () => {
        for (const [userId, connection] of userConnections.entries()) {
            if (connection.socket === ws) {
                userConnections.delete(userId);
                break;
            }
        }
        clearInterval(orderSimulationInterval);
    });
};
// Expire orders based on expiration
setInterval(async () => {
    const now = new Date();
    const orders = await Order.find({ status: "ACTIVE" });
    for (const order of orders) {
        const expirationTime = typeof order.expiration === "string"
            ? new Date(order.createdAt.getTime() + parseDuration(order.expiration))
            : new Date(order.expiration);
        if (expirationTime < now) {
            order.status = "EXPIRED";
            await order.save();
        }
    }
    const activeOrders = await Order.find({ status: "ACTIVE" });
    const orderHistory = await Order.find({ status: { $ne: "ACTIVE" } });
    broadcastOrderUpdate({
        type: "ORDER_UPDATE",
        orders: activeOrders,
        orderHistory,
    });
}, 5000);
function parseDuration(duration) {
    const durationMap = {
        seconds: 1000,
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000,
    };
    const [value, unit] = duration.split(" ");
    return parseInt(value) * (durationMap[unit] || 0);
}
// Broadcast trade info to clients
const broadcastTrade = (buyOrder, sellOrder, quantity) => {
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
const broadcastOrderUpdate = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
// Export the WebSocket server and connection handler
export { wss, handleConnection, broadcastTrade, broadcastOrderUpdate, notifyClient, notifyManagers, };
