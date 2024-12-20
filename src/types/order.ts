export interface Order {
  id: string;
  asset: string;
  quantity: number;
  price: number;
  expiration: string | Date;
  status?: string;
}

export interface FormData {
  asset: string;
  quantity: number;
  price: number;
  expirationDuration?: number;
  expirationUnit?: string;
  expirationDatetime?: string;
  type: "BUY" | "SELL";
}

export interface WebSocketMessage {
  type: "ORDER_UPDATE" | "NEW_ORDER" | "TRADE" | "ORDER_REJECTED";
  orders?: Order[];
  order?: Order;
  data?: {
    quantity: number;
    price: number;
  };
}
