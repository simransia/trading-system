// server/index.tsx
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { connectToMongo } from "./db";
import {
  handleConnection,
  startPriceSimulation,
  startOrderSimulation,
} from "./websocket";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// CORS config
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Routes
app.use(authRouter);
app.use(adminRouter);

// Start simulations once
startPriceSimulation(wss);
startOrderSimulation();

connectToMongo();

interface Connection {
  socket: WebSocket;
  role: "client" | "manager";
}

export { wss };
export const userConnections = new Map<string, Connection>();

// Add heartbeat check
wss.on("error", (error) => {
  console.error("WebSocket Server Error:", error);
});

// Initialize WebSocket
handleConnection(wss);

// Add error handling
wss.on("error", (error) => {
  console.error("WebSocket Server Error:", error);
});

// Add WebSocket upgrade handling
server.on("upgrade", (request, socket, head) => {
  const origin = request.headers.origin;

  // Add CORS check if needed
  if (
    !origin ||
    origin === process.env.CLIENT_URL ||
    origin === "http://localhost:3000"
  ) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
