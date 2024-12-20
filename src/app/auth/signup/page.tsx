"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signup } from "@/api/signup";
import { toast } from "react-toastify";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    // Password validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must be at least 6 characters long and contain at least one letter, one number, and one special character"
      );
      return;
    }

    try {
      const {
        token,
        role: userRole,
        userId,
      } = await signup(username, password, role);

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("userId", userId);

      toast.success("Account created successfully!");

      if (userRole === "admin") {
        router.push("/settlement-interface");
      } else {
        router.push("/client-interface");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
      setError(error instanceof Error ? error.message : "Signup failed");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6 text-white">Sign up</h1>
      <div className="text-white w-full space-y-6">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 px-3 w-full bg-transparent border-gray-500 rounded-lg"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 px-3 w-full bg-transparent border-gray-500 rounded-lg"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border p-2 px-3 w-full bg-transparent border-gray-500 rounded-lg"
        />

        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full bg-transparent border-gray-500">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E2329] border-gray-700">
            <SelectItem value="admin" className="text-gray-200">
              Admin
            </SelectItem>
            <SelectItem value="user" className="text-gray-200">
              User
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>
      )}

      <button
        onClick={handleSignup}
        className="bg-gradient-to-r cursor-pointer from-[#FCD535] hover:from-[#d89236]/90 hover:to-[#FCD535]/90 via-[#FCD535] to-[#d89236] shadow-md rounded-lg w-full text-black font-bold px-4 py-2 mt-6"
      >
        Continue
      </button>

      <p className="text-white text-sm mt-4">
        Already have an account?{" "}
        <Link href={"/auth/login"} className="hover:underline font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
