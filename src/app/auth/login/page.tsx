"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { role } = await response.json();
        localStorage.setItem("role", role);
        await router.push(role === "client" ? "/client" : "/manager");
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      setError("Login failed. Try again later.");
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6 text-white">Log in</h1>
      <div className="text-white w-full">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 px-3 w-full mb-6 bg-transparent border-gray-500 rounded-lg"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 px-3 w-full mb-6 bg-transparent border-gray-500 rounded-lg"
        />
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        onClick={handleLogin}
        className="bg-gradient-to-r from-[#FCD535] hover:from-[#d89236]/90 hover:to-[#FCD535]/90 via-[#FCD535] to-[#d89236] shadow-md rounded-lg w-full text-black font-bold px-4 py-2 my-2"
      >
        Continue
      </button>
      <p className="text-white text-xs mt-4">
        New User ?{" "}
        <Link href={"/auth/signup"} className="hover:underline font-semibold">
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default Login;
