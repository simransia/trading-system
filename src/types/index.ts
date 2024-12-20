export type OrderStatus = "New Order" | "ACCEPTED" | "REJECTED" | "FILLED";

export interface Order {
  _id: string;
  userId: string;
  asset: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  status: OrderStatus;
  expiration: Date | string;
  expired: boolean;
}

export interface OrderModification {
  orderId: string;
  field: "price" | "quantity" | "expiration";
  newValue: number | Date;
}

export interface TradeNotification {
  type: string;
  data?: {
    quantity: number;
    price: number;
  };
}

export interface MatchOpportunity {
  buyOrder: Order;
  sellOrder: Order;
  potentialProfit: number;
}

export interface WebSocketMessage {
  type: string;
  userId?: string;
  role?: string;
}

export interface OrderUpdateData {
  type: string;
  orders?: Order[];
  orderHistory?: Order[];
}
