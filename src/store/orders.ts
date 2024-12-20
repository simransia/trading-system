import { create } from "zustand";
import { Order } from "@/types";

interface OrderStore {
  activeOrders: Order[];
  orderHistory: Order[];
  updateOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  activeOrders: [],
  orderHistory: [],
  updateOrders: (orders) =>
    set({
      activeOrders: orders.filter(
        (order) => !order.expired && order.status === "New Order"
      ),
      orderHistory: orders.filter(
        (order) => order.expired || order.status !== "New Order"
      ),
    }),
  addOrder: (order) =>
    set((state) => ({
      activeOrders: [...state.activeOrders, order],
    })),
}));
