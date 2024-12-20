import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/types";
import SimpleBar from "simplebar-react";

const OrderHistoryTable = ({ orders }: { orders: Order[] }) => {
  return (
    <div className="h-[50vh]">
      <SimpleBar className="h-full">
        <Table>
          <TableHeader className="sticky top-0 bg-[#1E2329] z-10">
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">ID</TableHead>
              <TableHead className="text-gray-400">Asset</TableHead>
              <TableHead className="text-gray-400">Type</TableHead>
              <TableHead className="text-gray-400">Quantity</TableHead>
              <TableHead className="text-gray-400">Price</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Match ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} className="border-gray-700">
                <TableCell>{order._id}</TableCell>
                <TableCell>{order.asset}</TableCell>
                <TableCell>
                  <Badge
                    variant={order.type === "BUY" ? "success" : "destructive"}
                  >
                    {order.type}
                  </Badge>
                </TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>${order.price}</TableCell>
                <TableCell>
                  <Badge>{order.status}</Badge>
                </TableCell>
                <TableCell>{order.matchId || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SimpleBar>
    </div>
  );
};

export default OrderHistoryTable;
