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

interface OrderHistoryTableProps {
  orders: Order[];
}

const TABLE_HEADERS = [
  "Time",
  "Type",
  "Asset",
  "Price",
  "Quantity",
  "Status",
] as const;

const OrderHistoryTable = ({ orders }: OrderHistoryTableProps) => {
  return (
    <div className="h-[50vh] xl:h-[70vh]">
      <SimpleBar className="h-full">
        <Table>
          <TableHeader className="sticky top-0 bg-[#1E2329] z-10">
            <TableRow className="border-gray-700">
              {TABLE_HEADERS.map((header) => (
                <TableHead key={header} className="text-gray-400">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} className="border-gray-700">
                <TableCell>
                  {new Date(order.expiration).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={order.type === "BUY" ? "success" : "destructive"}
                  >
                    {order.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="bg-[#2A2E39] text-blue-400 border-blue-400"
                  >
                    {order.asset}
                  </Badge>
                </TableCell>
                <TableCell>${order.price}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.status === "FILLED"
                        ? "success"
                        : order.status === "REJECTED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SimpleBar>
    </div>
  );
};

export default OrderHistoryTable;
