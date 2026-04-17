/**
 * src/components/chat/message-renderer.tsx
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Check, Copy } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartData =
  | { type: "bar"; data: Record<string, unknown>[]; xKey: string; yKey: string; title?: string }
  | { type: "line"; data: Record<string, unknown>[]; xKey: string; yKey: string; title?: string }
  | { type: "pie"; data: { name: string; value: number }[]; title?: string };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
}

// ─── Chart colors ─────────────────────────────────────────────────────────────

const COLORS = ["#06200F", "#9ADF59", "#1B3A26", "#4C7C54", "#8FB996", "#E1E8E2"];

// ─── CodeBlock V2 (White Theme) ───────────────────────────────────────────────

interface CodeBlockProps {
  language?: string;
  code: string;
}

function CodeBlockV2({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm font-inherit">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 border-b border-gray-100/50">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          {language ?? "texto"}
        </span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-gray-900 transition-colors p-1"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto p-4 text-sm text-gray-700 font-mono leading-relaxed bg-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Chart Renderers (V2 White) ──────────────────────────────────────────────

function ChartRendererV2({ chart }: { chart: ChartData }) {
  const commonTooltipStyles = {
    backgroundColor: "#ffffff",
    border: "1px solid #f3f4f6",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
    fontSize: "12px",
  };

  const gridStroke = "#f3f4f6";

  switch (chart.type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chart.data as any}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey={chart.xKey} stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={commonTooltipStyles} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey={chart.yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chart.data as any}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis dataKey={chart.xKey} stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={commonTooltipStyles} />
            <Line type="monotone" dataKey={chart.yKey} stroke={COLORS[0]} strokeWidth={2.5} dot={{ fill: COLORS[0], r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={60} paddingAngle={5}>
              {chart.data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={commonTooltipStyles} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      );
  }
}

// ─── Markdown components V2 ──────────────────────────────────────────────────

const markdownComponentsV2: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const language = match ? match[1] : undefined;
    const code = String(children).replace(/\n$/, "");

    if (!className) {
      return (
        <code className="bg-gray-50 text-gray-900 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-gray-100" {...props}>
          {children}
        </code>
      );
    }
    return <CodeBlockV2 language={language} code={code} />;
  },

  table({ children }) {
    return (
      <div className="my-6 overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm text-left border-collapse">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
        {children}
      </thead>
    );
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-gray-50 bg-white text-gray-700 text-[13px]">{children}</tbody>;
  },
  th({ children }) {
    return <th className="px-5 py-3 font-semibold">{children}</th>;
  },
  td({ children }) {
    return <td className="px-5 py-3">{children}</td>;
  },

  p({ children }) {
    return <p className="mb-4 last:mb-0 leading-[1.7] text-gray-700 font-inherit">{children}</p>;
  },
  ul({ children }) {
    return <ul className="mb-4 ml-4 list-disc space-y-2 text-gray-700">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-4 ml-4 list-decimal space-y-2 text-gray-700">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-relaxed pl-1">{children}</li>;
  },
  h1: ({ children }) => <h1 className="text-xl font-bold mb-4 text-gray-900 tracking-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mb-3 text-gray-900 tracking-tight">{children}</h2>,
  strong: ({ children }) => <strong className="font-bold text-gray-950">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-emerald-100 pl-4 italic text-gray-500 my-6 py-1">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-gray-100 my-8" />,
};

// ─── MessageRendererV2 ────────────────────────────────────────────────────────

interface MessageRendererProps {
  message: ChatMessage;
}

export function MessageRenderer({ message }: MessageRendererProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-10 font-inherit animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      {isUser ? (
        <div className="flex gap-4 max-w-[85%] ml-auto">
          <div className="bg-white text-gray-950 border border-gray-100 rounded-[24px] rounded-tr-none px-6 py-3.5 text-[14px] leading-relaxed font-medium shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-gray-100 text-[11px] font-bold text-gray-400 shadow-sm mt-0.5">
            U
          </div>
        </div>
      ) : (
        <div className="flex gap-5 max-w-[92%]">
          <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 mt-1.5 bg-white border border-gray-50 rounded-full p-1 shadow-sm">
            <img src="/cow_robot.png" alt="smartCow" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[15px] leading-[1.8] text-gray-800 font-inherit prose prose-neutral max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponentsV2}>
                {message.content}
              </ReactMarkdown>

              {message.charts && message.charts.length > 0 && (
                <div className="mt-8 border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm p-6 animate-in zoom-in-95 duration-700">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">{message.charts[0].title || 'Análisis de Datos'}</p>
                   <ChartRendererV2 chart={message.charts[0]} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
