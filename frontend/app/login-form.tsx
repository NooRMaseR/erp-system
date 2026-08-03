'use client';

import { AlertCircle, ArrowRight } from "lucide-react";
import type { components } from "./generated/schema";
import { authenticateUser } from "./actions";
import { useAuthState } from "./utils/store";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";

type LoginRequest = components['schemas']['LoginRequest'];

export default function LoginForm() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginRequest>();
  const [error, setError] = useState<string | null>(null);
  const login = useAuthState(state => state.login);
  const router = useRouter();

  const submit = async (data: LoginRequest) => {
    const res = await authenticateUser(data);
    if (!res.success) {
      setError(res.error!);
      return;
    };

    login({ email: res.data!.email, username: res.data!.username, role: res.data!.role });

    switch (res.data!.role) {
      case "CLIENT":
        router.replace("/client/invoices");
        break;
      default:
        router.replace("/super/dashboard");
        break;
    };
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">

      {/* Error Message Display */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-medium border border-red-100">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600 transition-all text-slate-900"
          placeholder="Enter your email"
          {...register('email', { required: true })}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <a href="#" className="text-xs font-medium text-teal-600 hover:text-teal-700">Forgot?</a>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600 transition-all text-slate-900"
          placeholder="••••••••"
          {...register('password', { required: true })}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Authenticating..." : "Sign into Workspace"}
          {!isSubmitting && <ArrowRight size={18} />}
        </button>
      </div>
    </form>
  )
}
