import { Order, OrderModification } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
      <DialogContent>
        {children}
        <div className="space-y-4">
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
            className="w-full p-2 bg-gray-700 rounded"
            placeholder="New Value"
          />
          <button
            onClick={() =>
              handleModifyOrder(
                selectedOrder._id,
                modificationData.field,
                modificationData.newValue
              )
            }
            className="w-full p-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Confirm Modification
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationPopup;
