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
  };

  // Update the filtering logic
  const filterOrders = (orders: Order[]) => {
    const active = orders.filter(
      (order) => order.status === "New Order" && !order.expired
    );

    const matching = orders.filter(
      (order) =>
        (order.status === "ACCEPTED" || order.status === "REJECTED") &&
        !order.expired
    );

    const history = orders.filter(
      (order) => order.status === "FILLED" || order.expired
    );

    setActiveOrders(active);
    setMatchOpportunities(generateMatchOpportunities(matching));
    setOrderHistory(history);
  };

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === "ORDER_UPDATE") {
        setActiveOrders(data.orders || []);
        setOrderHistory(data.orderHistory || []);
      }
    }
  }, [lastMessage, setActiveOrders, setOrderHistory]);

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
    filterOrders,
    setMatchOpportunities,
  };
};
