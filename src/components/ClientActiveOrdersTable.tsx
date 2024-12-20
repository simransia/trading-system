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
import "simplebar-react/dist/simplebar.min.css";
import { Badge } from "@/components/ui/badge";

interface ClientActiveOrdersTableProps {
  orders: Order[];
}

const TABLE_HEADERS = [
  "ID",
  "Asset",
  "Type",
  "Quantity",
  "Price",
  "Expiration",
  "Status",
] as const;

const ClientActiveOrdersTable = ({ orders }: ClientActiveOrdersTableProps) => {
  return (
    <div className="h-[50vh] w-full">
      <SimpleBar className="h-full">
        <Table>
          <TableHeader className="sticky top-0 bg-[#1E2329] rounded-md z-10">
            <TableRow className="border-gray-700">
              {TABLE_HEADERS.map((header) => (
                <TableHead key={header} className="text-gray-400 text-center">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order._id}
                className="border-gray-700 text-gray-200"
              >
                <TableCell>{order._id}</TableCell>
                <TableCell>{order.asset}</TableCell>
                <TableCell>{order.type}</TableCell>
                <TableCell>{order.quantity}</TableCell>
                <TableCell>${order.price}</TableCell>
                <TableCell>
                  {new Date(order.expiration).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.status === "New Order"
                        ? "secondary"
                        : order.status === "ACCEPTED"
                        ? "success"
                        : order.status === "REJECTED"
                        ? "destructive"
                        : "default"
                    }
                    className="border-gray-700"
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

export default ClientActiveOrdersTable;
