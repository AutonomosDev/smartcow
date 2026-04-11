/**
 * src/components/chat/message-renderer.tsx
 * Renderiza respuestas de Claude con soporte para:
 * - Codeblocks con syntax highlighting (shiki)
 * - Tablas desde markdown (react-markdown + remark-gfm)
 * - Texto plano sin markdown rico
 * - Gráficos (recharts) — activados por artifacts de Claude
 * Ticket: AUT-113
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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

// ─── CodeBlock con highlighting ───────────────────────────────────────────────

interface CodeBlockProps {
  language?: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-gray-100 bg-[#FAFBFA] shadow-sm font-outfit">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-[#333]">
        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
          {language ?? "texto"}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-brand-dark/60 hover:text-brand-dark transition-colors px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 font-medium"
        >
          {copied ? "copiado" : "copiar"}
        </button>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto p-4 text-sm text-gray-700 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Chart Renderers ──────────────────────────────────────────────────────────

function BarChartRenderer({
  data,
  xKey,
  yKey,
  title,
}: Extract<ChartData, { type: "bar" }>) {
  return (
    <div className="my-4">
      {title && (
        <p className="text-sm text-gray-400 mb-2 text-center">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data as Record<string, string | number>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey={xKey} stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2023",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#f9fafb",
            }}
          />
          <Legend />
          <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function LineChartRenderer({
  data,
  xKey,
  yKey,
  title,
}: Extract<ChartData, { type: "line" }>) {
  return (
    <div className="my-4">
      {title && (
        <p className="text-sm text-gray-400 mb-2 text-center">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data as Record<string, string | number>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey={xKey} stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2023",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#f9fafb",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={COLORS[0]}
            strokeWidth={2}
            dot={{ fill: COLORS[0], r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PieChartRenderer({
  data,
  title,
}: Extract<ChartData, { type: "pie" }>) {
  return (
    <div className="my-4">
      {title && (
        <p className="text-sm text-gray-400 mb-2 text-center">{title}</p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2023",
              border: "1px solid #444",
              borderRadius: 8,
              color: "#f9fafb",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartRenderer({ chart }: { chart: ChartData }) {
  switch (chart.type) {
    case "bar":
      return <BarChartRenderer {...chart} />;
    case "line":
      return <LineChartRenderer {...chart} />;
    case "pie":
      return <PieChartRenderer {...chart} />;
  }
}

// ─── Markdown components ──────────────────────────────────────────────────────

const markdownComponents: Components = {
  // Codeblocks
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const language = match ? match[1] : undefined;
    const code = String(children).replace(/\n$/, "");

    // Inline code (sin saltos de línea)
    if (!className) {
      return (
        <code
          className="bg-gray-100 text-brand-dark px-1.5 py-0.5 rounded text-[13px] font-mono border border-gray-200/50"
          {...props}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock language={language} code={code} />;
  },

  // Tablas
  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm text-left border-collapse">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return (
      <thead className="bg-[#F8FAFC] text-gray-600 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
        {children}
      </thead>
    );
  },
  tbody({ children }) {
    return (
      <tbody className="divide-y divide-gray-50 bg-white text-gray-700 text-[13px]">
        {children}
      </tbody>
    );
  },
  th({ children }) {
    return <th className="px-4 py-3 font-medium">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-3">{children}</td>;
  },

  // Párrafos
  p({ children }) {
    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
  },

  // Listas
  ul({ children }) {
    return (
      <ul className="mb-3 ml-4 list-disc space-y-1 text-gray-700">{children}</ul>
    );
  },
  ol({ children }) {
    return (
      <ol className="mb-3 ml-4 list-decimal space-y-1 text-gray-700">{children}</ol>
    );
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>;
  },

  // Headers — mínimos, el chat no es un documento
  h1({ children }) {
    return <h1 className="text-lg font-semibold mb-2 text-gray-900">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-base font-semibold mb-2 text-gray-900">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-sm font-semibold mb-1 text-gray-800">{children}</h3>;
  },

  // Strong / em
  strong({ children }) {
    return <strong className="font-semibold text-gray-900">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic text-gray-600">{children}</em>;
  },

  // Blockquote
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-brand-light/40 pl-4 italic text-gray-500 my-4 bg-gray-50/50 py-1 rounded-r-lg">
        {children}
      </blockquote>
    );
  },

  // HR
  hr() {
    return <hr className="border-[#333] my-4" />;
  },
};

// ─── MessageRenderer ──────────────────────────────────────────────────────────

interface MessageRendererProps {
  message: ChatMessage;
}

export function MessageRenderer({ message }: MessageRendererProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[85%] rounded-[20px] px-5 py-3.5 shadow-sm transition-all duration-300 ${
          isUser
            ? "bg-white border border-brand-light/20 text-gray-800 rounded-br-sm shadow-card"
            : "bg-[#E8F5E9]/60 text-gray-800 border border-[#C8E6C9]/30 rounded-bl-sm backdrop-blur-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
            {/* Gráficos (artifacts) */}
            {message.charts && message.charts.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.charts.map((chart, idx) => (
                  <ChartRenderer key={idx} chart={chart} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
