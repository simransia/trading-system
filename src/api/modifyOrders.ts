import { API_BASE_URL } from "@/config";

export const modifyOrder = async (
  orderId: string,
  field: "price" | "quantity" | "expiration",
  newValue: number | Date
) => {
  const response = await fetch(`${API_BASE_URL}/api/modify-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId,
      field,
      newValue,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to modify order");
  }

  return response.json();
};
