import { API } from "../../utils/api";
import { Download } from "lucide-react";
import { LedgerRow } from "./ledgerRow";
import { LedgerSearch } from "./ledger-search";
import { LedgerFilter } from "./ledger-filter";

export default async function LedgerPage({searchParams}: {searchParams: Promise<{ inv?: string; client?: string; status?: string }>}) {
  const {inv, client, status} = await searchParams
  const { data, error } = await API.GET("/ledger/", {
    params: {
      query: {
        inv,
        client,
        status,
      },
    },
  });

  if (error) {
    return <div className="p-10 text-red-500">Failed to fetch ledger from Backend.</div>;
  }

  const invoices = data || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 flex-1 min-h-screen bg-slate-50/50">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">General Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">Manage billing, accounts receivable, and ETA e-Invoice compliance.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors">
            + Draft Invoice
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <LedgerSearch />
        <LedgerFilter />
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
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
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No invoices match your search criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <LedgerRow key={invoice.id} inv={invoice} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}