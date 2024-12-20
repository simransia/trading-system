// server/index.tsx
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import mongoose from "mongoose";
import { handleConnection } from "./websocket";

const app = express();
const server = createServer(app);
export const wss = new WebSocketServer({ server });
export const userConnections = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New client connected");
  handleConnection(ws);
});

// Start server
const PORT = process.env.PORT || 8080;
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/trading")
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
