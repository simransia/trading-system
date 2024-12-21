import { Order, OrderModification } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ModificationPopupProps {
  handleModifyOrder: (
    orderId: string,
    field: "price" | "quantity" | "expiration",
    newValue: number | Date
  ) => void;
  setModificationData: (data: OrderModification) => void;
  selectedOrder: Order;
  modificationData: OrderModification;
  setIsModifying: (isModifying: boolean) => void;
  children: React.ReactNode;
}

const ModificationPopup = ({
  handleModifyOrder,
  setModificationData,
  selectedOrder,
  modificationData,
  setIsModifying,
  children,
}: ModificationPopupProps) => {
  return (
    <Dialog open={true} onOpenChange={() => setIsModifying(false)}>
      <DialogContent className="bg-[#1E2329] border border-gray-700 text-gray-100 max-w-md">
        <div className="mb-6">
          {children}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Order ID:</span>
              <span className="text-sm font-mono">{selectedOrder._id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Current Price:</span>
              <span className="text-sm">${selectedOrder.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Type:</span>
              <Badge
                variant={
                  selectedOrder.type === "BUY" ? "success" : "destructive"
                }
                className="text-xs"
              >
                {selectedOrder.type}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Price
            </label>
            <input
              type="number"
              value={modificationData.newValue as number}
              onChange={(e) =>
                setModificationData({
                  orderId: selectedOrder._id,
                  field: "price",
                  newValue: parseFloat(e.target.value),
                })
              }
              className="w-full p-3 bg-[#2A2E39] border border-gray-700 rounded-lg 
                text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200"
              placeholder="Enter new price"
              step="0.01"
            />
          </div>

          <button
            onClick={() =>
              handleModifyOrder(
                selectedOrder._id,
                modificationData.field,
                modificationData.newValue
              )
            }
            className="w-full p-3 bg-blue-500 text-white rounded-lg 
              hover:bg-blue-600 transition-colors duration-200 font-medium
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:ring-offset-[#1E2329]"
          >
            Confirm Modification
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationPopup;
