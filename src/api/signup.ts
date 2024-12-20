import { API_BASE_URL } from "@/config";

interface SignupResponse {
  token: string;
  role: string;
  userId: string;
  message: string;
}

export const signup = async (
  username: string,
  password: string,
  role: string
): Promise<SignupResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Signup failed");
  }

  return response.json();
};
