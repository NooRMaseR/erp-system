
import { Building2, Briefcase, Mail, ShieldCheck } from "lucide-react";

const MOCK_CLIENTS = [
  { id: 1, name: "Cairo Logistics Hub", taxId: "123-456-789", contract: "Annual Tax Retainer", value: "EGP 120,000", status: "Active" },
  { id: 2, name: "Alexandria Maritime", taxId: "321-654-987", contract: "Quarterly Audit", value: "EGP 45,000", status: "Active" },
  { id: 3, name: "Nile Real Estate Group", taxId: "456-789-123", contract: "Full Financial Advisory", value: "EGP 240,000", status: "Review Pending" },
];

export default function CRMPage() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 flex-1 min-h-screen bg-slate-50/50">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client Portfolio</h1>
          <p className="text-slate-500 text-sm mt-1">Manage corporate profiles, tax credentials, and active retainers.</p>
        </div>
        <button className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors">
          + Onboard New Client
        </button>
      </div>

      {/* CRM Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
        {MOCK_CLIENTS.map((client) => (
          <div key={client.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{client.name}</h3>
                  <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={12} className="text-emerald-500" /> Tax ID: {client.taxId}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Briefcase size={14}/> Active Contract</span>
                <span className="font-medium text-slate-900">{client.contract}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Mail size={14}/> Client Portal</span>
                <span className="text-teal-600 font-semibold cursor-pointer hover:underline">Invited</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}