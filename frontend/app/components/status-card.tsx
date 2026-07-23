import React from 'react'

type StatusCardProps = {
    title: string;
    content: string;
}

export default function StatusCard({ title, content }: StatusCardProps) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
            <h4 className="text-xl font-bold mt-1">{content}</h4>
        </div>
    )
}
