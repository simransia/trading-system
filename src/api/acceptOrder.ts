import { API_BASE_URL } from "@/config";

export const acceptOrder = async (orderId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/accept-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to accept order");
  }

  return response.json();
};
