import { create } from "zustand";

interface Order {
  id: string;
  asset: string;
  quantity: number;
  price: number;
  expiration: string | Date;
  status?: string;
}

interface OrderState {
  activeOrders: Order[];
  orderHistory: Order[];
  addOrder: (order: Order) => void;
  updateOrders: (orders: Order[]) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrders: [] as Order[],
  orderHistory: [] as Order[],
  addOrder: (order: Order) =>
    set((state: OrderState) => ({
      activeOrders: [...state.activeOrders, order],
    })),
  updateOrders: (updatedOrders: Order[]) =>
    set(() => ({
      activeOrders: updatedOrders.filter((order) => order.status === "ACTIVE"),
      orderHistory: updatedOrders.filter((order) => order.status !== "ACTIVE"),
    })),
}));
