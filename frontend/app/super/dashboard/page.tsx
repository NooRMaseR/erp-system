import { API } from "@/app/utils/api";
import { LedgerRow } from "../ledger/ledgerRow";
import { DollarSign, Users, FileText } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [dashboardRes, ledgerRes] = await Promise.all([
    API.GET("/dashboard/"),
    API.GET("/ledger/")
  ]);

  if (dashboardRes.error) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        Failed to fetch dashboard metrics.
      </div>
    );
  }

  const metrics = dashboardRes.data;
  const recentInvoices = ledgerRes.data?.slice(0, 5) || [];

  return (
    <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 bg-slate-50/50 min-h-screen text-slate-900">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enterprise Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time operational updates for your financial workspace.</p>
        </div>
        <Link
          href="/super/ledger/create"
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center"
        >
          + Create New Invoice
        </Link>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Revenue Metric */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">GROSS REVENUE (PAID)</span>
            <DollarSign className="text-teal-600" size={16} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">{metrics.totalRevenue}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <span>{metrics.growth}</span> <span className="text-slate-400">vs last month</span>
            </p>
          </div>
        </div>

        {/* Active Clients */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">ACTIVE CLIENTS</span>
            <Users className="text-slate-400" size={16} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">{metrics.activeClients}</div>
            <p className="text-xs text-slate-400 mt-1">B2B Corporate Retainers</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">SENT INVOICES</span>
            <FileText className="text-amber-500" size={16} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight">{metrics.pendingInvoices}</div>
            <p className="text-xs text-amber-600 font-medium mt-1">Awaiting client payment</p>
          </div>
        </div>
      </div>

      {/* THE FINANCIAL LEDGER TABLE LAYER */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900">Recent Financial Operations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Right-click records to access operational action menus.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs tracking-wider">
                <th className="p-4">DOCUMENT SERIAL</th>
                <th className="p-4">CLIENT ENTITY</th>
                <th className="p-4">ISSUE DATE</th>
                <th className="p-4">GROSS TOTAL</th>
                <th className="p-4">PAYMENT STATUS</th>
                <th className="p-4">ETA COMPLIANCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No recent invoices found.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <LedgerRow key={inv.id} inv={inv} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}