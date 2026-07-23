import { Building2 } from "lucide-react";
import LoginForm from "./login-form";

export default function LoginPage() {

  return (
    <div className="min-h-screen w-full p-6 bg-slate-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

        {/* Header Section */}
        <div className="bg-teal-900 p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-800 text-teal-300 mb-4 shadow-inner">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AccountFlow Pro</h1>
          <p className="text-teal-200 text-sm mt-2">Enterprise Financial Management</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <LoginForm />
        </div>

      </div>
    </div>
  );
}