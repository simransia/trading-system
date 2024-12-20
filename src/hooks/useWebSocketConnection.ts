import { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import { API_BASE_URL } from "@/config";
import { Order } from "@/types";

export const useWebSocketConnection = (
  setActiveOrders: (orders: Order[]) => void,
  setOrderHistory: (orders: Order[]) => void,
  findMatchOpportunities: (orders: Order[]) => void
) => {
  const { lastMessage, sendMessage } = useWebSocket(
    API_BASE_URL.replace("http", "ws"),
    {
      onOpen: () => {
        console.log("WebSocket connected");
        sendMessage(
          JSON.stringify({
            type: "IDENTIFY",
            userId: localStorage.getItem("userId"),
            role: "manager",
          })
        );
      },
      onClose: () => console.log("WebSocket disconnected"),
      shouldReconnect: () => true,
      reconnectInterval: 3000,
    }
  );

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === "ORDER_UPDATE") {
        setActiveOrders(data.orders || []);
        setOrderHistory(data.orderHistory || []);
        findMatchOpportunities(data.orders || []);
      }
    }
  }, [lastMessage, setActiveOrders, setOrderHistory, findMatchOpportunities]);

  return { sendMessage };
};
