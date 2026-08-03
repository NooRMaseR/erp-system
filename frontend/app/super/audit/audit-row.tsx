"use client";

import { User, ChevronDown, ChevronUp, Mail } from "lucide-react";
import type { components } from "@/app/generated/schema";
import { useState } from "react";

// 🌟 مكون مساعد وذكي لتحويل الـ JSON إلى واجهة مقروءة للبشر
const DataViewer = ({ data, type }: { data: object; type: "before" | "after" }) => {
  const valueColor = type === "before" ? "text-red-400" : "text-emerald-400";
  const boxBg = type === "before" ? "bg-red-950/20" : "bg-emerald-950/20";
  const borderColor = type === "before" ? "border-red-900/30" : "border-emerald-900/30";

  if (data === null || data === undefined) {
    return <span className="text-slate-600">فارغ</span>;
  }

  // إذا كانت البيانات عبارة عن قائمة (مثل بنود الفاتورة Items)
  if (Array.isArray(data)) {
    return (
      <div className="space-y-3 w-full mt-2">
        {data.map((item, index) => (
          <div key={index} className={`p-3 rounded-xl border ${borderColor} ${boxBg} shadow-sm`}>
            <DataViewer data={item} type={type} />
          </div>
        ))}
      </div>
    );
  }

  // إذا كانت البيانات عبارة عن كائن (Object)
  if (typeof data === "object") {
    return (
      <div className="flex flex-col w-full">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 py-2 border-b border-slate-800/50 last:border-0">
            {/* اسم الحقل مبرمج ليظهر بشكل أنيق */}
            <span className="text-slate-400 font-medium min-w-30 text-xs uppercase tracking-wider pt-0.5">
              {key.replace(/_/g, " ")}
            </span>
            <div className="flex-1">
              {typeof value === "object" ? (
                <DataViewer data={value} type={type} />
              ) : (
                <span className={`font-mono text-sm font-semibold ${valueColor}`} dir="ltr">
                  {String(value)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // إذا كانت البيانات نص عادي أو رقم
  return (
    <span className={`font-mono text-sm font-semibold ${valueColor}`} dir="ltr">
      {String(data)}
    </span>
  );
};


export function AuditRow({ log }: { log: components['schemas']['AuditLogSerializer'] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChanges = log.changes && log.changes.before && log.changes.after;

  return (
    <>
      <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? "bg-slate-50" : ""}`}>
        <td className="p-4 font-mono text-xs text-slate-500 font-semibold">#{log.id}</td>
        
        {/* عمود الإيميل الجديد */}
        <td className="p-4">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="bg-slate-200 p-1.5 rounded-full">
              <Mail size={14} className="text-slate-600"/>
            </div>
            {log.email}
          </div>
        </td>

        {/* عمود اسم المستخدم */}
        <td className="p-4">
          <div className="flex items-center gap-2 font-medium text-slate-900">
            <div className="bg-slate-200 p-1.5 rounded-full">
              <User size={14} className="text-slate-600"/>
            </div>
            {log.username}
          </div>
        </td>
        <td className="p-4">
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase">
            {log.module}
          </span>
        </td>
        <td className="p-4 font-medium text-slate-800">{log.action}</td>
        <td className="p-4 text-slate-500 text-xs font-mono" dir="ltr">{log.date}</td>
        <td className="p-4 text-left">
          {hasChanges ? (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
            >
              {isExpanded ? "إخفاء التفاصيل" : "مقارنة التعديلات"}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <span className="text-xs text-slate-400">لا توجد تفاصيل</span>
          )}
        </td>
      </tr>

      {/* منطقة عرض البيانات للمقارنة */}
      {isExpanded && hasChanges && (
        <tr>
          {/* تم تعديل colSpan إلى 7 ليتناسب مع إضافة عمود الإيميل */}
          <td colSpan={7} className="p-0 border-b border-slate-200 bg-slate-900 shadow-inner">
            <div className="p-6 text-slate-300 font-sans overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 🔴 قسم قبل التعديل */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-red-900/30">
                  <div className="flex items-center gap-2 text-red-400 font-bold mb-4 border-b border-red-900/30 pb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    بيانات السجل قبل التعديل (Before)
                  </div>
                  <DataViewer data={log.changes.before as object} type="before" />
                </div>

                {/* 🟢 قسم بعد التعديل */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-emerald-900/30">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4 border-b border-emerald-900/30 pb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    بيانات السجل بعد التعديل (After)
                  </div>
                  <DataViewer data={log.changes.after as object} type="after" />
                </div>

              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}