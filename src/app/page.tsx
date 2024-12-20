"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      router.push("/auth/login");
      return;
    }

    if (role === "admin") {
      router.push("/settlement-interface");
    } else {
      router.push("/client-interface");
    }
  }, [router]);

  return <div>Loading...</div>;
}
