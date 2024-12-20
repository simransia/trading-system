import { useState, useEffect } from "react";
import { Order, MatchOpportunity, OrderModification } from "@/types";
import { acceptOrder } from "@/api/acceptOrder";
import { rejectOrder } from "@/api/rejectOrder";
import { matchOrders } from "@/api/matchOrders";
import { fetchMatchOpportunities } from "@/api/matchOpportunities";
import { modifyOrder } from "@/api/modifyOrders";

const MAX_ACTIVE_ORDERS = 100;
const MAX_ORDER_HISTORY = 50;

export const useOrderManagement = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [matchOpportunities, setMatchOpportunities] = useState<
    MatchOpportunity[]
  >([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [modificationData, setModificationData] = useState<OrderModification>({
    orderId: "",
    field: "price",
    newValue: 0,
  });

  // Order management functions
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      await fetchMatchOpportunities();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await rejectOrder(orderId);
    } catch (error) {
      console.error("Failed to reject order:", error);
    }
  };

  const handleMatchOrders = async (buyOrderId: string, sellOrderId: string) => {
    try {
      await matchOrders(buyOrderId, sellOrderId);
      await fetchMatchOpportunities();
    } catch (error) {
      console.error("Failed to match orders:", error);
    }
  };

  const handleModifyOrder = async (
    orderId: string,
    field: "price" | "quantity" | "expiration",
    newValue: number | Date
  ) => {
    try {
      await modifyOrder(orderId, field, newValue);
      setIsModifying(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to modify order:", error);
    }
  };

  const findMatchOpportunities = async () => {
    try {
      const opportunities = await fetchMatchOpportunities();
      setMatchOpportunities(opportunities);
    } catch (error) {
      console.error("Failed to fetch match opportunities:", error);
    }
  };

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
    selectedOrder,
    isModifying,
    modificationData,
    setActiveOrders,
    setOrderHistory,
    setSelectedOrder,
    setIsModifying,
    setModificationData,
    handleAcceptOrder,
    handleRejectOrder,
    handleMatchOrders,
    handleModifyOrder,
    findMatchOpportunities,
    fetchMatchOpportunities,
  };
};
