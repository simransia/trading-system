import { API_BASE_URL } from "@/config";

export const fetchMatchOpportunities = async () => {
  const response = await fetch(`${API_BASE_URL}/api/match-opportunities`);
  if (!response.ok) {
    throw new Error("Failed to fetch opportunities");
  }
  return response.json();
};
