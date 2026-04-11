"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ChatShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {copied ? <Check size={14} className="text-green-600" /> : <Share2 size={14} />}
      <span>{copied ? "Copiado" : "Compartir"}</span>
    </button>
  );
}
