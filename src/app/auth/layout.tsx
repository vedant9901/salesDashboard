"use client";

// import "@/css/satoshi.css";
// import "@/css/style.css";
import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthLayout({ children }: PropsWithChildren) {
  const router = useRouter();

  
 useEffect(() => {
  if (typeof window === "undefined") return;

  const sessionStr = localStorage.getItem("session");

  // Not logged in → allow auth pages to load
  if (!sessionStr) return;

  let sessionData = null;

  try {
    sessionData = JSON.parse(sessionStr);
  } catch {
    localStorage.removeItem("session");
    return;
  }

  const expiry = Number(sessionData.expiry);
  const now = Date.now();

  if (expiry < now) {
    localStorage.removeItem("session");
    return;
  }

  // ✔ Only redirect logged-in users away from auth pages
  const currentPath = window.location.pathname;

  const isAuthPage =
    currentPath === "/auth/sign-in" ||
    currentPath === "/login" ||
    currentPath === "/auth" ||
    currentPath.startsWith("/auth/");

  if (isAuthPage) {
    router.replace("/");
  }
}, [router]);


  return <>{children}</>;
}
