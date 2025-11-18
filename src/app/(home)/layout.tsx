"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setSession } from "@/store/security";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { NAV_DATA } from "@/components/Layouts/sidebar/data";

interface Props {
  children: ReactNode;
}

/* ---------------------------------------------
   FIND MODULE FOR PATH
---------------------------------------------- */
function findModuleForPath(pathname: string): number | null {
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      if (item.url === pathname) return item.moduleNumber ?? null;

      for (const sub of item.items || []) {
        if (sub.url === pathname) return sub.moduleNumber ?? null;
      }
    }
  }
  return null;
}

/* ---------------------------------------------
   FIRST ALLOWED MODULE ROUTE
---------------------------------------------- */
function getFirstAllowedRoute(userModules: number[]) {
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      if (item.moduleNumber && userModules.includes(item.moduleNumber)) {
        return item.url;
      }
      for (const sub of item.items || []) {
        if (sub.moduleNumber && userModules.includes(sub.moduleNumber)) {
          return sub.url;
        }
      }
    }
  }
  return "/"; // fallback
}

export default function ProtectedLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userModules, setUserModules] = useState<number[]>([]);

  /* ---------------------------------------------
     SESSION CHECK
  ---------------------------------------------- */
  useEffect(() => {
  const sessionStr = localStorage.getItem("session");

  // No session → allow only /auth/sign-in
  if (!sessionStr) {
    if (!pathname.startsWith("/auth")) {
      router.replace("/auth/sign-in");
    }
    return;
  }

  try {
    const session = JSON.parse(sessionStr);

    if (session.expiry < Date.now()) {
      localStorage.removeItem("session");
      if (!pathname.startsWith("/auth")) {
        router.replace("/auth/sign-in");
      }
      return;
    }

    dispatch(setSession(session));
    setIsAuthenticated(true);
    setUserModules(session.modules || []);
    setAuthChecked(true);

    // Redirect from root "/" to first allowed
    if (pathname === "/") {
      router.replace(getFirstAllowedRoute(session.modules || []));
    }

  } catch {
    localStorage.removeItem("session");
    if (!pathname.startsWith("/auth")) {
      router.replace("/auth/sign-in");
    }
  }

}, [pathname]);


  /* ---------------------------------------------
     MODULE ACCESS CHECK
  ---------------------------------------------- */
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    if (pathname.startsWith("/auth")) return;

    const required = findModuleForPath(pathname);

    if (required && !userModules.includes(required)) {
      router.replace(getFirstAllowedRoute(userModules));
    }
  }, [pathname, authChecked, isAuthenticated, userModules]);

  /* FIRST ALLOWED MODULE ROUTE */
function getFirstAllowedRoute(userModules: number[]): string {
  for (const section of NAV_DATA) {
    for (const item of section.items) {
      if (item.moduleNumber && userModules.includes(item.moduleNumber)) {
        return item.url ?? "/";
      }
      for (const sub of item.items || []) {
        if (sub.moduleNumber && userModules.includes(sub.moduleNumber)) {
          return sub.url ?? "/";
        }
      }
    }
  }
  return "/"; // guaranteed fallback
}

  return (
    <div className="flex min-h-screen">
      {isAuthenticated && !pathname.startsWith("/auth") && <Sidebar />}
      <div className="flex-1 flex flex-col">
        {isAuthenticated && !pathname.startsWith("/auth") && <Header />}
        <main className="flex-1">{authChecked ? children : null}</main>
      </div>
    </div>
  );
}
