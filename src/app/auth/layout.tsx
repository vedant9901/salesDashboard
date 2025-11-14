"use client";

import "@/css/satoshi.css";
import "@/css/style.css";
import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({ children }: PropsWithChildren) {
  const router = useRouter();

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    const sessionStr = localStorage.getItem("session");

    // No session → allow access to login pages
    if (!sessionStr) return;

    try {
      const sessionData = JSON.parse(sessionStr);
      const expiry = Number(sessionData.expiry);
      const now = Date.now();

      // If session expired → clean & allow user to stay on login page
      if (expiry < now) {
        localStorage.removeItem("session");
        return;
      }

      // ---- IMPORTANT FIX ----
      // Redirect logged-in users ONLY if they are on login/auth pages
      const currentPath = window.location.pathname;

      const isAuthPage =
        currentPath === "/login" ||
        currentPath === "/auth" ||
        currentPath.startsWith("/auth/");

      if (isAuthPage) {
        router.replace("/"); // send to home
      }
    } catch (error) {
      console.log("Invalid session, clearing...");
      localStorage.removeItem("session");
    }
  }, [router]);

  return <>{children}</>;
}
