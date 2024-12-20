import { API_BASE_URL } from "@/config";

export const rejectOrder = async (orderId: string) => {
  const response = await fetch(`${API_BASE_URL}/api/reject-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to reject order");
  }

  return response.json();
};
