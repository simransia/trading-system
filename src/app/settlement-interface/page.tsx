"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ModificationPopup from "@/components/admin/ModificationPopup";
import { Badge } from "@/components/ui/badge";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import ActiveOrdersTable from "@/components/admin/ActiveOrdersTable";
import OrderHistoryTable from "@/components/admin/OrderHistoryTable";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { useWebSocketConnection } from "@/hooks/useWebSocketConnection";

const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

const SettlementInterface = () => {
  const router = useRouter();

  const {
    activeOrders,
    orderHistory,
    matchOpportunities,
    setMatchOpportunities,
  } = useWebSocketConnection();

  const {
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
  } = useOrderManagement({ setMatchOpportunities });

  // Authentication check
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0B0E11] text-gray-200 p-6">
      <div className="max-w-[1800px] flex flex-col mx-auto gap-y-6">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Settlement Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Badge
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("userId");
                router.push("/auth/login");
              }}
              variant="outline"
              className="text-blue-400 border-blue-400"
            >
              Manager View
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 3xl:grid-cols-2 items-start gap-6">
          {/* Active Orders */}

          <div className="bg-[#1E2329] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-6">
              Active Orders
            </h2>
            <ActiveOrdersTable
              orders={activeOrders}
              selectedOrder={selectedOrder}
              onOrderSelect={setSelectedOrder}
              onAcceptOrder={handleAcceptOrder}
              onRejectOrder={handleRejectOrder}
              onModifyOrder={() => setIsModifying(true)}
            />
          </div>

          {/* Market Overview */}
          <div className="bg-[#1E2329] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-6">
              Market Overview
            </h2>
            <Chart />
          </div>
        </div>

        <div className="grid grid-cols-1  3xl:grid-cols-2 gap-6">
          {/* Match Opportunities */}
          <div className="bg-[#1E2329] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-6">
              Match Opportunities
            </h2>
            <SimpleBar className="h-[50vh]">
              <div className="space-y-4 pr-4">
                {matchOpportunities.map((opportunity, index) => (
                  <div
                    key={index}
                    className={`
                        p-4 rounded-lg bg-[#2A2E39] border border-gray-700
                        ${
                          opportunity.potentialProfit > 100
                            ? "border-green-500/50"
                            : ""
                        }
                      `}
                  >
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="font-semibold text-green-400">
                          Potential Profit: $
                          {opportunity.potentialProfit.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">
                          Buy: {opportunity.buyOrder.quantity} @ $
                          {opportunity.buyOrder.price}
                        </p>
                        <p className="text-sm text-gray-400">
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
                        className="px-4 py-2 font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                      >
                        Match Orders
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SimpleBar>
          </div>

          {/* Order History */}
          <div className="bg-[#1E2329] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-6">
              Order History
            </h2>
            <OrderHistoryTable orders={orderHistory} />
          </div>
        </div>
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
          <h3 className="text-lg font-bold mb-4">Modify Order</h3>
        </ModificationPopup>
      )}
    </div>
  );
};

export default SettlementInterface;
