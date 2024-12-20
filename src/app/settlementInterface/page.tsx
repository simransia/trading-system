"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useWebSocket from "react-use-websocket";
import dynamic from "next/dynamic";
import ModificationPopup from "@/components/ModificationPopup";

// Dynamic import for Chart component with no SSR
const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

interface Order {
  _id: string;
  asset: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  status: string;
  expiration: Date;
  modificationHistory?: {
    field: "price" | "quantity" | "expiration";
    oldValue: number | Date;
    newValue: number | Date;
    timestamp: Date;
  }[];
}

interface MatchOpportunity {
  buyOrder: Order;
  sellOrder: Order;
  potentialProfit: number;
}

interface OrderModification {
  orderId: string;
  field: "price" | "quantity" | "expiration";
  newValue: number | Date;
}

interface TradeNotification {
  type: string;
  data?: {
    quantity: number;
    price: number;
  };
}

interface OrderUpdateData {
  type: string;
  orders?: Order[];
  orderHistory?: Order[];
}

interface WebSocketMessage {
  type: string;
  userId?: string;
  role?: string;
}

const SettlementInterface = () => {
  const router = useRouter();
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

  // Authentication check
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.push("/auth/login");
    }
  }, [router]);

  // WebSocket connection
  const { lastMessage } = useWebSocket("ws://localhost:8080", {
    onOpen: () => {
      console.log("WebSocket connected");
      // Identify as manager
      sendMessage({
        type: "IDENTIFY",
        userId: localStorage.getItem("userId") || undefined,
        role: "manager",
      });
    },
    onClose: () => console.log("WebSocket disconnected"),
    shouldReconnect: () => true,
    reconnectInterval: 3000,
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      switch (data.type) {
        case "ORDER_UPDATE":
          handleOrderUpdate(data);
          break;
        case "TRADE":
          handleTradeNotification(data);
          break;
      }
    }
  }, [lastMessage]);

  // Handle order updates
  const handleOrderUpdate = (data: OrderUpdateData) => {
    if (data.orders) {
      const newOrders = data.orders.filter(
        (order: Order) => order.status === "New Order"
      );
      setActiveOrders(newOrders);
      findMatchOpportunities(newOrders);
    }
    if (data.orderHistory) {
      setOrderHistory(data.orderHistory);
    }
  };

  // Find potential matches
  const findMatchOpportunities = (orders: Order[]) => {
    const buyOrders = orders.filter(
      (o) => o.type === "BUY" && o.status === "ACCEPTED"
    );
    const sellOrders = orders.filter(
      (o) => o.type === "SELL" && o.status === "ACCEPTED"
    );

    const opportunities: MatchOpportunity[] = [];

    buyOrders.forEach((buyOrder) => {
      sellOrders.forEach((sellOrder) => {
        if (
          buyOrder.price >= sellOrder.price &&
          buyOrder.asset === sellOrder.asset
        ) {
          const potentialProfit =
            (buyOrder.price - sellOrder.price) *
            Math.min(buyOrder.quantity, sellOrder.quantity);

          opportunities.push({
            buyOrder,
            sellOrder,
            potentialProfit,
          });
        }
      });
    });

    setMatchOpportunities(
      opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit)
    );
  };

  // Order management functions
  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/accept-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) throw new Error("Failed to accept order");

      // Refresh match opportunities
      fetchMatchOpportunities();
    } catch (error) {
      console.error("Failed to accept order:", error);
    }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/reject-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) throw new Error("Failed to reject order");
    } catch (error) {
      console.error("Failed to reject order:", error);
    }
  };

  const handleMatchOrders = async (buyOrderId: string, sellOrderId: string) => {
    try {
      const response = await fetch("http://localhost:8080/api/match-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyOrderId, sellOrderId }),
      });

      if (!response.ok) throw new Error("Failed to match orders");

      // Refresh opportunities after successful match
      fetchMatchOpportunities();
    } catch (error) {
      console.error("Failed to match orders:", error);
    }
  };

  const fetchMatchOpportunities = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/match-opportunities"
      );
      if (!response.ok) throw new Error("Failed to fetch opportunities");

      const data = await response.json();
      findMatchOpportunities([...data.buyOrders, ...data.sellOrders]);
    } catch (error) {
      console.error("Failed to fetch match opportunities:", error);
    }
  };

  const handleTradeNotification = (data: TradeNotification) => {
    if (data.data) {
      const { quantity, price } = data.data;
      alert(`Trade executed! ${quantity} units at $${price}`);
      fetchMatchOpportunities();
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (lastMessage?.target instanceof WebSocket) {
      const ws = lastMessage.target;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    }
  };

  const handleModifyOrder = async (
    orderId: string,
    field: "price" | "quantity" | "expiration",
    newValue: number | Date
  ) => {
    try {
      const response = await fetch("http://localhost:8080/api/modify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          modifications: { [field]: newValue },
        }),
      });

      if (!response.ok) throw new Error("Failed to modify order");

      // Refresh orders after modification
      fetchMatchOpportunities();
      setIsModifying(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to modify order:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-2 gap-8">
        {/* Left column: Active Orders and Actions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Active Orders</h2>
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Order ID</th>
                  <th className="border border-gray-300 p-2">Asset</th>
                  <th className="border border-gray-300 p-2">Type</th>
                  <th className="border border-gray-300 p-2">Price</th>
                  <th className="border border-gray-300 p-2">Quantity</th>
                  <th className="border border-gray-300 p-2">Status</th>
                  <th className="border border-gray-300 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr
                    key={order._id}
                    className={`
                      ${selectedOrder?._id === order._id ? "bg-blue-50" : ""}
                      ${order.status === "ACCEPTED" ? "bg-green-50" : ""}
                    `}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="border border-gray-300 p-2">{order._id}</td>
                    <td className="border border-gray-300 p-2">
                      {order.asset}
                    </td>
                    <td className="border border-gray-300 p-2">{order.type}</td>
                    <td className="border border-gray-300 p-2">
                      ${order.price}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {order.quantity}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {order.status}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {order.status === "New Order" ? (
                        <>
                          <button
                            onClick={() => rejectOrder(order._id)}
                            className="bg-red-500 text-white px-2 py-1 rounded mr-2"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => acceptOrder(order._id)}
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                          >
                            Accept
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsModifying(true)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded"
                        >
                          Modify
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modification Modal */}
          {isModifying && selectedOrder && (
            <ModificationPopup
              handleModifyOrder={handleModifyOrder}
              setModificationData={setModificationData}
              selectedOrder={selectedOrder}
              modificationData={modificationData}
              setIsModifying={setIsModifying}
            >
              {" "}
              <h3 className="text-lg font-bold mb-4">Modify Order</h3>
            </ModificationPopup>
          )}
        </div>

        {/* Right column: Match Opportunities and Charts */}
        <div>
          <h2 className="text-xl font-bold mb-4">Match Opportunities</h2>
          <div className="mb-6">
            <Chart />
          </div>

          <div className="space-y-4">
            {matchOpportunities.map((opportunity, index) => (
              <div
                key={index}
                className={`
                  p-4 border rounded-lg bg-white shadow hover:shadow-md transition-shadow
                  ${
                    opportunity.potentialProfit > 100
                      ? "border-green-500 border-2"
                      : ""
                  }
                `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Potential Profit: $
                      {opportunity.potentialProfit.toFixed(2)}
                    </p>
                    <p>
                      Buy: {opportunity.buyOrder.quantity} @ $
                      {opportunity.buyOrder.price}
                    </p>
                    <p>
                      Sell: {opportunity.sellOrder.quantity} @ $
                      {opportunity.sellOrder.price}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleMatchOrders(
                        opportunity.buyOrder._id,
                        opportunity.sellOrder._id
                      )
                    }
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Match Orders
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order History */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Order History</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Time</th>
                  <th className="border border-gray-300 p-2">Type</th>
                  <th className="border border-gray-300 p-2">Asset</th>
                  <th className="border border-gray-300 p-2">Price</th>
                  <th className="border border-gray-300 p-2">Quantity</th>
                  <th className="border border-gray-300 p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map((order) => (
                  <tr key={order._id}>
                    <td className="border border-gray-300 p-2">
                      {new Date(order.expiration).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2">{order.type}</td>
                    <td className="border border-gray-300 p-2">
                      {order.asset}
                    </td>
                    <td className="border border-gray-300 p-2">
                      ${order.price}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {order.quantity}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <span
                        className={`
                        px-2 py-1 rounded text-sm
                        ${
                          order.status === "FILLED"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                        ${
                          order.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : ""
                        }
                        ${
                          order.status === "EXPIRED"
                            ? "bg-gray-100 text-gray-800"
                            : ""
                        }
                      `}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementInterface;
