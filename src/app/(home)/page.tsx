"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [user, setUser] = useState({
    email: "",
    name: "User",
    img: "/images/user/user-03.png",
  });

  // Load user session
  useEffect(() => {
    const sessionStr = localStorage.getItem("session");
    if (!sessionStr) return;

    try {
      const session = JSON.parse(sessionStr);
      setUser({
        email: session.email || "",
        name: session.name || "User",
        img: session.img || "/images/user/user-03.png",
      });
    } catch {
      console.error("Failed to parse session");
    }
  }, []);

  return (
    <div className="p-10 animate-fadeIn text-gray-900">

      {/* Header */}
      <div className="flex items-center gap-5 mb-10">
        <img
          src={user.img}
          alt="User"
          className="w-14 h-14 rounded-full border border-gray-200 shadow-sm"
        />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-500 mt-1">
            Your Magson Performance Dashboard
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-3xl text-[17px] leading-relaxed text-gray-600">
        Gain clarity across sales performance, category trends, store operations,
        and margin analytics — all in one minimal and powerful dashboard
        experience.  
        Use the sidebar on the left to begin.
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">

        <div className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-semibold text-lg mb-1">Sales Overview</h3>
          <p className="text-gray-500 text-sm">
            Daily, MTD, category, and storewise analytics.
          </p>
        </div>

        <div className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-2xl mb-3">🏬</div>
          <h3 className="font-semibold text-lg mb-1">Store Performance</h3>
          <p className="text-gray-500 text-sm">
            Comparative insights across all locations.
          </p>
        </div>

        <div className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-2xl mb-3">💰</div>
          <h3 className="font-semibold text-lg mb-1">Margins & Profit</h3>
          <p className="text-gray-500 text-sm">
            Track margin %, leaks, and contribution.
          </p>
        </div>

      </div>

      {/* Minimal CTA */}
      <div className="mt-16 bg-gray-50 border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <h2 className="text-xl font-medium text-gray-800 mb-2">
          You're all set.
        </h2>
        <p className="text-gray-500">
          Choose a module from the sidebar to get started.
        </p>
      </div>

    </div>
  );
}
