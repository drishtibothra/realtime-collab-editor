import { useState } from "react";
import type { FormEvent } from "react";
import { FileText, Eye, EyeOff, Users, Zap } from "lucide-react";
import { login, signup } from "../features/auth/authApi";

export default function AuthPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(email, password);
        resetFields();
        setMode("login");
        setInfo("Account created — log in below.");
        setIsSubmitting(false);
        return;
      }
      const { data } = await login(email, password);
      onLogin(data.access_token);
    } catch {
      setError(mode === "login" ? "Invalid email or password." : "Couldn't create account — try a different email.");
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    resetFields();
    setError("");
    setInfo("");
    setMode(mode === "login" ? "signup" : "login");
  };

  return (
    <div className="h-screen w-screen flex">
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FileText size={20} />
            </div>
            <span className="font-semibold text-lg">Collab Editor</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">Write together,<br />live.</h1>
            <p className="text-teal-50 text-lg max-w-md">
              Real-time collaborative editing with conflict-free merging — see every keystroke, every cursor, instantly.
            </p>
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2 text-teal-50">
                <Zap size={18} /><span className="text-sm">Instant sync</span>
              </div>
              <div className="flex items-center gap-2 text-teal-50">
                <Users size={18} /><span className="text-sm">Live presence</span>
              </div>
            </div>
          </div>

          <p className="text-teal-100 text-xs">CRDT-powered · No conflicts, ever.</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="bg-teal-50 p-2 rounded-lg">
              <FileText size={20} className="text-teal-600" />
            </div>
            <span className="font-semibold text-lg text-slate-800">Collab Editor</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {mode === "login" ? "Log in to open your documents" : "Takes less than a minute"}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 pr-10 text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 pr-10 text-sm
                      focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-colors" />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
            {info && <p className="text-sm text-teal-600 mb-4">{info}</p>}

            <button type="submit" disabled={isSubmitting}
              className="w-full bg-teal-500 text-white font-semibold py-2.5 rounded-lg text-sm
                hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-60 shadow-sm shadow-teal-500/30">
              {isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-slate-500 text-center mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={switchMode} className="text-teal-600 font-semibold hover:underline">
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}