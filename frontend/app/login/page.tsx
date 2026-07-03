"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleLogin = async () => {

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const response = await fetch(`${API_BASE}/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
    password,
  }),
});

  const data = await response.json();

console.log(data);

if (data.message) {
    localStorage.setItem(
  "user",
  JSON.stringify(data)
);

  localStorage.setItem(
    "user",
    JSON.stringify(data)
  );

  router.push("/dashboard");

} else {

  alert(data.error);

}
};

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">

      <div className="bg-zinc-900 p-10 rounded-3xl w-[450px]">

        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome Back
        </h1>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-800"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-zinc-800"
          />

          <button
  onClick={handleLogin}
  className="w-full p-4 rounded-xl bg-purple-600"
>
            Login
          </button>

        </div>

      </div>

    </main>
  );
}
