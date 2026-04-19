"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { IconCopy, IconCheck, IconRefresh, IconBookmark } from "./chat-icons";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChartData =
  | { type: "bar";  data: Record<string, unknown>[]; xKey: string; yKey: string; title?: string }
  | { type: "line"; data: Record<string, unknown>[]; xKey: string; yKey: string; title?: string }
  | { type: "pie";  data: { name: string; value: number }[]; title?: string };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
}

// ── Chart colors ───────────────────────────────────────────────────────────────

const CHART_COLORS = ["#1e3a2f", "#7ecfa0", "#2b6a4a", "#4c7c54", "#8fb996", "#e6f3ec"];

// ── Code block ─────────────────────────────────────────────────────────────────

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 rounded-[8px] overflow-hidden border border-[#e8e5df] bg-[#fafaf7]">
      <div className="flex items-center justify-between px-[12px] py-[7px] border-b border-[#f0ede8]">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.6px]"
          style={{ fontFamily: "var(--font-mono)", color: "#999" }}
        >
          {language ?? "código"}
        </span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-[#bbb] hover:text-[#666] transition-colors"
        >
          {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
        </button>
      </div>
      <pre
        className="overflow-x-auto px-[14px] py-[12px] text-[12.5px] leading-[1.6] text-[#1a1a1a]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Charts ─────────────────────────────────────────────────────────────────────

function ChartRenderer({ chart }: { chart: ChartData }) {
  const tooltipStyle = {
    backgroundColor: "#fff",
    border: "1px solid #f0ede8",
    borderRadius: "6px",
    fontSize: "12px",
    fontFamily: "var(--font-mono)",
  };
  switch (chart.type) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chart.data as never}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
            <XAxis dataKey={chart.xKey} stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8f6f1" }} />
            <Bar dataKey={chart.yKey} fill="#1e3a2f" radius={[4,4,0,0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chart.data as never}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
            <XAxis dataKey={chart.xKey} stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#bbb" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey={chart.yKey} stroke="#1e3a2f" strokeWidth={2} dot={{ fill: "#1e3a2f", r: 3, strokeWidth: 1.5, stroke: "#fff" }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={48} paddingAngle={4}>
              {chart.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend verticalAlign="bottom" height={32} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      );
  }
}

// ── Markdown components — DM Sans prose + mono tokens ─────────────────────────

const mdComponents: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const language = match?.[1];
    const code = String(children).replace(/\n$/, "");
    if (!className) {
      return (
        <code
          className="px-[5px] py-[1px] rounded-[4px] text-[12.5px]"
          style={{
            fontFamily: "var(--font-mono)",
            background: "var(--code-red-bg)",
            color: "var(--code-red-fg)",
          }}
        >
          {children}
        </code>
      );
    }
    return <CodeBlock language={language} code={code} />;
  },

  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-[8px] border border-[#e8e5df]">
        <table
          className="w-full text-left border-collapse"
          style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="border-b border-[#e8e5df] bg-[#fafaf7]">{children}</thead>;
  },
  th({ children }) {
    return (
      <th
        className="px-[12px] py-[8px] text-[10px] font-semibold uppercase tracking-[0.5px] text-[#999]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {children}
      </th>
    );
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-[#f0ede8]">{children}</tbody>;
  },
  td({ children }) {
    return <td className="px-[12px] py-[8px] text-[12px] text-[#1a1a1a]">{children}</td>;
  },

  p({ children }) {
    return (
      <p
        className="mb-[14px] last:mb-0 text-[13.5px] leading-[1.65] text-[#1a1a1a]"
        style={{ textWrap: "pretty" } as React.CSSProperties}
      >
        {children}
      </p>
    );
  },
  ul({ children }) {
    return <ul className="mb-[14px] space-y-[6px] text-[#1a1a1a]">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-[14px] space-y-[6px] text-[#1a1a1a]">{children}</ol>;
  },
  li({ children }) {
    return (
      <li className="flex gap-[8px] text-[13.5px] leading-[1.6]">
        <span className="text-[#bbb] flex-shrink-0 mt-[3px]">·</span>
        <span>{children}</span>
      </li>
    );
  },
  h1: ({ children }) => <h1 className="text-[18px] font-bold mb-[12px] text-[#1a1a1a] tracking-tight">{children}</h1>,
  h2: ({ children }) => <h2 className="text-[14px] font-semibold mb-[8px] mt-[18px] text-[#1a1a1a] tracking-tight">{children}</h2>,
  h3: ({ children }) => <h3 className="text-[13px] font-semibold mb-[6px] mt-[14px] text-[#1a1a1a]">{children}</h3>,
  strong: ({ children }) => <strong className="font-semibold text-[#1a1a1a]">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#e8e5df] pl-[12px] italic text-[#666] my-4 py-[2px]">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[#f0ede8] my-6" />,
  a: ({ children, href }) => (
    <a href={href} className="text-[#2b6a4a] underline underline-offset-2 decoration-[#7ecfa0]">
      {children}
    </a>
  ),
};

// ── Typing indicator ───────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="flex gap-[10px] mb-[18px] items-center">
      <div className="w-[22px] h-[22px] rounded-full bg-[#1e3a2f] flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="#7ecfa0" strokeWidth="1.5"/>
          <path d="M5 7h4M7 5v4" stroke="#7ecfa0" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="flex gap-[4px] items-center py-[2px]">
        {[0, 200, 400].map((delay) => (
          <div
            key={delay}
            className="w-[5px] h-[5px] rounded-full bg-[#1e3a2f]"
            style={{ animation: `chat-blink 1.4s infinite ${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export function MessageRenderer({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex mb-[18px] animate-in fade-in duration-300">
        <div
          className="sc-chip max-w-[72%] text-left"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-[10px] mb-[18px] items-start animate-in fade-in duration-300">
      <div className="w-[22px] h-[22px] rounded-full bg-[#1e3a2f] flex items-center justify-center flex-shrink-0 mt-[2px]">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="#7ecfa0" strokeWidth="1.5"/>
          <path d="M5 7h4M7 5v4" stroke="#7ecfa0" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] leading-[1.65] text-[#1a1a1a]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        </div>

        {message.charts && message.charts.length > 0 && (
          <div className="mt-3 bg-white border border-[#e8e5df] rounded-[8px] overflow-hidden">
            <div className="px-[12px] py-[8px] border-b border-[#f0ede8]">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#999]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {message.charts[0].title ?? "análisis"}
              </span>
            </div>
            <div className="p-[12px]">
              <ChartRenderer chart={message.charts[0]} />
            </div>
          </div>
        )}

        <div className="flex gap-[10px] mt-[8px]">
          {[
            { icon: <IconCopy size={12} />, label: "Copiar" },
            { icon: <IconRefresh size={12} />, label: "Regenerar" },
            { icon: <IconBookmark size={12} />, label: "Guardar" },
          ].map(({ icon, label }) => (
            <button key={label} title={label} className="text-[#ccc] hover:text-[#666] transition-colors">
              {icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
