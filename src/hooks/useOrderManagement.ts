import { useState } from "react";
import { MatchOpportunity, Order, OrderModification } from "@/types";
import { acceptOrder } from "@/api/acceptOrder";
import { rejectOrder } from "@/api/rejectOrder";
import { matchOrders } from "@/api/matchOrders";
import { fetchMatchOpportunities } from "@/api/matchOpportunities";
import { modifyOrder } from "@/api/modifyOrders";

export const useOrderManagement = ({
  setMatchOpportunities,
}: {
  setMatchOpportunities: (opportunities: MatchOpportunity[]) => void;
}) => {
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
      if (opportunities) {
        setMatchOpportunities(opportunities);
      }
    } catch (error) {
      console.error("Failed to fetch match opportunities:", error);
    }
  };

  return {
    selectedOrder,
    isModifying,
    modificationData,
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
