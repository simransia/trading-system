import { API_BASE_URL } from "@/config";

export const acceptOrder = async (orderId: string) => {
  console.log("Sending accept order request for:", orderId);

  const response = await fetch(`${API_BASE_URL}/api/accept-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    throw new Error("Failed to accept order");
  }

  const data = await response.json();
  console.log("Accept order response:", data);
  return data;
};
