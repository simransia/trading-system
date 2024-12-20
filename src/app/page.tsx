"use client";
import React, { useState } from "react";
import { useOrderStore } from "../store/orders";
import useWebSocket from "react-use-websocket";
import Chart from "@/components/Chart";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import OrderCreationForm from "@/components/OrderCreationForm";

interface Order {
  id: string;
  asset: string;
  quantity: number;
  price: number;
  expiration: string | Date;
  status?: string;
}

interface WebSocketMessage {
  type: "ORDER_UPDATE" | "NEW_ORDER" | "TRADE" | "ORDER_REJECTED";
  orders?: Order[];
  order?: Order;
  data?: {
    quantity: number;
    price: number;
  };
}

const ClientInterface = () => {
  const { activeOrders, orderHistory, addOrder, updateOrders } =
    useOrderStore();

  const [error, setError] = useState<string | null>(null);

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    "ws://localhost:8080",
    {
      onOpen: () => {
        sendJsonMessage({
          type: "IDENTIFY",
          userId: "client-id",
          role: "client",
        });
      },
      onError: (event: Event) => {
        setError(
          "WebSocket error: " +
            (event instanceof ErrorEvent
              ? event.message
              : `Unknown error ${event}`)
        );
      },
      onMessage: () => {
        if (lastJsonMessage) {
          const { type, orders, order, data } =
            lastJsonMessage as WebSocketMessage;

          switch (type) {
            case "ORDER_UPDATE":
              if (orders) {
                updateOrders(orders);
              }
              break;
            case "NEW_ORDER":
              if (order) {
                addOrder(order);
              }
              break;
            case "TRADE":
              console.log("Trade executed:", data);
              break;
            case "ORDER_REJECTED":
              console.error("Order rejected:", order);
              break;
            default:
              console.warn("Unhandled message type:", type);
          }
        }
      },
    }
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome Trader!</h1>

      <OrderCreationForm />
      <div>
        <Chart />
      </div>
      {error && <p className="text-red-500">{error}</p>}

      {/* Active Orders Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        <table className="table-auto w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Asset</th>
              <th className="px-4 py-2 border">Quantity</th>
              <th className="px-4 py-2 border">Price</th>
              <th className="px-4 py-2 border">Expiration</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.map((order: Order) => (
              <tr key={order.id}>
                <td className="px-4 py-2 border">{order.id}</td>
                <td className="px-4 py-2 border">{order.asset}</td>
                <td className="px-4 py-2 border">{order.quantity}</td>
                <td className="px-4 py-2 border">{order.price}</td>
                <td className="px-4 py-2 border">
                  {new Date(order.expiration).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order History Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        <table className="table-auto w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Asset</th>
              <th className="px-4 py-2 border">Quantity</th>
              <th className="px-4 py-2 border">Price</th>
              <th className="px-4 py-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order: Order) => (
              <tr key={order.id}>
                <td className="px-4 py-2 border">{order.id}</td>
                <td className="px-4 py-2 border">{order.asset}</td>
                <td className="px-4 py-2 border">{order.quantity}</td>
                <td className="px-4 py-2 border">{order.price}</td>
                <td className="px-4 py-2 border">{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientInterface;
