import { API_BASE_URL } from "@/config";

interface LoginResponse {
  token: string;
  role: string;
  userId: string;
}

export const login = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid username or password");
  }

  return response.json();
};
