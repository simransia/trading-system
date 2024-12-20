import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { API_BASE_URL } from "@/config";
import { Order, MatchOpportunity } from "@/types";

const MAX_ACTIVE_ORDERS = 100;
const MAX_ORDER_HISTORY = 50;

export const useWebSocketConnection = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [matchOpportunities, setMatchOpportunities] = useState<
    MatchOpportunity[]
  >([]);

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

  const generateMatchOpportunities = (orders: Order[]) => {
    const acceptedOrders = orders.filter(
      (order) => order.status === "ACCEPTED"
    );

    const buyOrders = acceptedOrders.filter((order) => order.type === "BUY");
    const sellOrders = acceptedOrders.filter((order) => order.type === "SELL");

    return buyOrders
      .flatMap((buyOrder) =>
        sellOrders
          .filter(
            (sellOrder) =>
              sellOrder.price <= buyOrder.price &&
              buyOrder.asset === sellOrder.asset
          )
          .map((sellOrder) => ({
            buyOrder,
            sellOrder,
            potentialProfit:
              (sellOrder.price - buyOrder.price) *
              Math.min(buyOrder.quantity, sellOrder.quantity),
          }))
      )
      .sort((a, b) => b.potentialProfit - a.potentialProfit);
  };

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === "ORDER_UPDATE") {
        const allOrders = data.orders || [];

        // Active orders: ONLY New Orders that aren't expired
        const active = allOrders.filter(
          (order: Order) => order.status === "New Order" && !order.expired
        );

        // Match opportunities: only ACCEPTED orders
        const acceptedOrders = allOrders.filter(
          (order: Order) => order.status === "ACCEPTED" && !order.expired
        );

        // History: only FILLED or expired orders
        const history = allOrders.filter(
          (order: Order) => order.status === "FILLED" || order.expired
        );

        // Update states
        setActiveOrders(active); // Only New Orders will show here
        setOrderHistory(history);

        // Generate match opportunities from accepted orders
        if (acceptedOrders.length > 0) {
          const opportunities = generateMatchOpportunities(acceptedOrders);
          setMatchOpportunities(opportunities);
        }
      }
    }
  }, [lastMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setActiveOrders([]);
      setOrderHistory([]);
      setMatchOpportunities([]);
    };
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setActiveOrders((prev) => {
        const now = new Date();
        return prev
          .filter((order) => new Date(order.expiration) > now)
          .slice(-MAX_ACTIVE_ORDERS);
      });

      setOrderHistory((prev) => prev.slice(-MAX_ORDER_HISTORY));
      setMatchOpportunities((prev) => prev.slice(-20));
    }, 60000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    activeOrders,
    orderHistory,
    matchOpportunities,
    setMatchOpportunities,
  };
};
