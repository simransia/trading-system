import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/types";
import SimpleBar from "simplebar-react";
import { Badge } from "@/components/ui/badge";

interface ActiveOrdersTableProps {
  orders: Order[];
  selectedOrder: Order | null;
  onOrderSelect: (order: Order) => void;
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onModifyOrder: () => void;
}

const ActiveOrdersTable = ({
  orders,
  selectedOrder,
  onOrderSelect,
  onAcceptOrder,
  onRejectOrder,
  onModifyOrder,
}: ActiveOrdersTableProps) => {
  return (
    <div className="h-[50vh] ">
      <SimpleBar className="h-full relative">
        <Table>
          <TableHeader className="sticky top-0 bg-[#1E2329] z-10">
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">ID</TableHead>
              <TableHead className="text-gray-400">Asset</TableHead>
              <TableHead className="text-gray-400">Type</TableHead>
              <TableHead className="text-gray-400">Quantity</TableHead>
              <TableHead className="text-gray-400">Price</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => (
              <TableRow
                key={index}
                className={`border-gray-700 ${
                  selectedOrder?._id === order._id ? "bg-blue-500/10" : ""
                }`}
                onClick={() => onOrderSelect(order)}
              >
                <TableCell>{order._id}</TableCell>
                <TableCell>{order.asset}</TableCell>
                <TableCell>
                  <Badge
                    variant={order.type === "BUY" ? "success" : "destructive"}
                    className={
                      order.type === "BUY" ? "bg-green-500/10" : "bg-red-500/10"
                    }
                  >
                    {order.type}
                  </Badge>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>${order.price}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      order.status === "New Order"
                        ? "bg-yellow-500/10"
                        : "bg-green-500/10"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptOrder(order._id)}
                      className="px-2 py-1 bg-green-500 rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRejectOrder(order._id)}
                      className="px-2 py-1 bg-red-500 rounded hover:bg-red-600"
                    >
                      Reject
                    </button>
                    <button
                      onClick={onModifyOrder}
                      className="px-2 py-1 bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Modify
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SimpleBar>
    </div>
  );
};

export default ActiveOrdersTable;
