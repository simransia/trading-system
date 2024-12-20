import useWebSocket from "react-use-websocket";
import { useCallback } from "react";
import { Order, OrderUpdateData } from "@/types";
import { API_BASE_URL } from "@/config";

export const useClientWebSocket = (updateOrders: (orders: Order[]) => void) => {
  const userId = localStorage.getItem("userId");

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    API_BASE_URL.replace("http", "ws"),
    {
      onOpen: () => {
        if (!userId) {
          console.log("No userId found, skipping connection");
          return;
        }
        console.log("WebSocket connected, userId:", userId);
        sendJsonMessage({
          type: "IDENTIFY",
          userId,
          role: "client",
        });
      },
      onError: (error) => {
        console.error("WebSocket error:", error);
      },
      shouldReconnect: () => {
        return !!userId; // Only reconnect if we have a userId
      },
    }
  );

  const handleMessage = useCallback(() => {
    if (lastJsonMessage) {
      const data = lastJsonMessage as OrderUpdateData;

      if (data.type === "ORDER_UPDATE") {
        const allOrders = [
          ...(data.orders || []),
          ...(data.orderHistory || []),
        ];
        const clientOrders = allOrders.filter(
          (order) => order.userId === userId
        );
        updateOrders(clientOrders);
      }
    }
  }, [lastJsonMessage, updateOrders, userId]);

  return { sendJsonMessage, handleMessage };
};
