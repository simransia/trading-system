import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ModificationPopupProps {
  children: React.ReactNode;
  modificationData: {
    orderId: string;
    field: "price" | "quantity" | "expiration";
    newValue: number | Date;
  };
  selectedOrder: {
    _id: string;
    price: number;
  };
  setModificationData: (data: {
    orderId: string;
    field: "price" | "quantity" | "expiration";
    newValue: number | Date;
  }) => void;
  handleModifyOrder: (
    orderId: string,
    field: "price" | "quantity" | "expiration",
    newValue: number | Date
  ) => void;
  setIsModifying: (isModifying: boolean) => void;
}

const ModificationPopup = ({
  children,
  modificationData,
  selectedOrder,
  setModificationData,
  handleModifyOrder,
  setIsModifying,
}: ModificationPopupProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Price</label>
                <input
                  type="number"
                  value={
                    typeof modificationData.newValue === "number"
                      ? modificationData.newValue
                      : selectedOrder.price
                  }
                  onChange={(e) =>
                    setModificationData({
                      orderId: selectedOrder._id,
                      field: "price",
                      newValue: parseFloat(e.target.value),
                    })
                  }
                  className="border rounded p-2 w-full"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModifying(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleModifyOrder(
                      modificationData.orderId,
                      modificationData.field,
                      modificationData.newValue
                    )
                  }
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModificationPopup;
