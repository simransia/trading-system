"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore } from "@/store/orders";
import Chart from "@/components/Chart";
import "react-datetime-picker/dist/DateTimePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-clock/dist/Clock.css";
import OrderCreationForm from "@/components/OrderCreationForm";
import MarketOverview from "@/components/MarketOverview";
import { useClientWebSocket } from "@/hooks/useClientWebSocket";
import ClientActiveOrdersTable from "@/components/ClientActiveOrdersTable";
import ClientOrderHistoryTable from "@/components/ClientOrderHistoryTable";

const ClientInterface = () => {
  const router = useRouter();
  const { activeOrders, orderHistory, updateOrders } = useOrderStore();
  const { handleMessage } = useClientWebSocket(updateOrders);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      router.push("/auth/login");
    }
  }, []);

  useEffect(() => {
    handleMessage();
  }, [handleMessage]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    window.location.href = "/auth/login";
  };

  return (
    <div className="p-6 bg-[#191e23] flex flex-col gap-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome Trader!</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      <MarketOverview />
      <OrderCreationForm />
      <div>
        <h2 className="text-xl text-white rounded-md font-semibold mb-4">
          Volume Price Analysis
        </h2>
        <Chart />
      </div>

      <div className="mb-8 bg-gray-900 rounded-md p-4">
        <h2 className="text-xl text-white rounded-md font-semibold mb-4">
          Active Orders
        </h2>
        <ClientActiveOrdersTable orders={activeOrders} />
      </div>

      <div className="bg-gray-900 rounded-md p-4 mb-10">
        <h2 className="text-xl text-white font-semibold mb-4">Order History</h2>
        <ClientOrderHistoryTable orders={orderHistory} />
      </div>
    </div>
  );
};

export default ClientInterface;
