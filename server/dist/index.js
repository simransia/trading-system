// server/index.tsx
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
const PORT = 8080;
const app = express();
const server = createServer(app);
export const wss = new WebSocketServer({ server });
// Track WebSocket connections by user ID and role
export const userConnections = new Map();
app.use(cors());
app.use(express.json());
// Use routes
app.use(adminRouter);
app.use(authRouter);
// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
