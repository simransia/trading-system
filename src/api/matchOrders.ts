import { API_BASE_URL } from "@/config";

export const matchOrders = async (buyOrderId: string, sellOrderId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/match-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyOrderId, sellOrderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to match orders");
  }

  return response.json();
};
