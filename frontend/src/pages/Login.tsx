import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = login(username.trim(), password);
    if (!ok) return setError("Sai tài khoản hoặc mật khẩu.");
    nav("/", { replace: true });
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6">
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Đăng nhập</div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Demo: admin / 123456</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-200">Username</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-200">Password</label>
          <input
            type="password"
            className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button className="w-full rounded-xl bg-gray-900 text-white py-2">Đăng nhập</button>
      </form>
    </div>
  );
}
