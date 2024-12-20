import { API_BASE_URL } from "@/config";

interface OrderData {
  asset: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  expiration?: Date;
}

export const placeOrder = async (orderData: OrderData) => {
  const response = await fetch(`${API_BASE_URL}/api/place-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to place order");
  }

  return response.json();
};
