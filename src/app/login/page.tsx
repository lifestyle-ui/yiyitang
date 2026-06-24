"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("密碼錯誤，請再試一次");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "#F7F6F3" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm mb-4" style={{ background: "#1A1A1A" }}>
            <Heart className="w-5 h-5" style={{ color: "#C8C2B8" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>意一堂健康管理系統</h1>
          <p className="text-sm mt-1" style={{ color: "#8A8580" }}>請輸入存取密碼以繼續</p>
        </div>

        <div className="rounded-sm p-6" style={{ background: "#FFFFFF", border: "1px solid #ECEAE6" }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A8A5A0" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="輸入密碼"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-sm focus:outline-none focus:ring-1"
                style={{ border: "1px solid #DDDAD4" }}
                autoFocus
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 text-sm font-medium rounded-sm transition-opacity disabled:opacity-50"
              style={{ background: "#2C4A3E", color: "#F7F6F3" }}>
              {loading ? "驗證中..." : "進入系統"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
