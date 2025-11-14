"use client";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { loginUser, selectSecurity, setSession } from "@/store/security";
import SigninWithPassword from "@/components/Auth/SigninWithPassword";
import toast from "react-hot-toast";

export default function SignInPage() {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  const securityState = useSelector(selectSecurity);

  const status = securityState?.status;
  const error = securityState?.error;

  const handleLogin = async (userData: { email: string; password: string }) => {
    try {
      const session = await dispatch(loginUser(userData)).unwrap();

      // Ensure expiry exists
      if (!session.expiry) {
        session.expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      }

      // Store session
      localStorage.setItem("session", JSON.stringify(session));
      dispatch(setSession(session));

      toast.success("Login successful");

      // 🔥 FIXED: ALWAYS GO TO /home (NOT MODULE BASED REDIRECT)
      setTimeout(() => router.push("/"), 0);

    } catch (err: any) {
      toast.error(err.message || "Login failed");
    }
  };

  if (!securityState) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl dark:shadow-gray-800 bg-white dark:bg-gray-800">
        <div className="w-full xl:w-1/2 p-8 sm:p-12">
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            Enter your credentials below to access your dashboard
          </p>

          <SigninWithPassword
            onLogin={handleLogin}
            loading={status === "loading"}
          />
          {status === "failed" && <p className="text-red-500">{error}</p>}
        </div>

        <div className="hidden xl:flex xl:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-600 p-12 items-center justify-center">
          <div className="text-white">
            <h2 className="mb-4 text-4xl font-extrabold">Welcome Back!</h2>
            <p className="max-w-sm text-lg opacity-90">
              Manage your account, track performance, and stay connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
