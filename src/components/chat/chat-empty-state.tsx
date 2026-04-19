"use client";

const CONTEXT_CHIPS = ["/feedlot", "/FT", "/vaquillas", "/partos", "/tratamientos", "/ventas"];

const font = "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)";

interface ChatEmptyStateProps {
  nombrePredio: string | null | undefined;
  userName?: string | null;
  onSuggestionClick: (text: string) => void;
}

export function ChatEmptyState({ nombrePredio, userName, onSuggestionClick }: ChatEmptyStateProps) {
  const firstName = userName?.split(" ")[0];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 16px", textAlign: "center",
      fontFamily: font,
    }}>
      <img
        src="/cow_robot.png"
        alt="SmartCow"
        style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 14, background: "#ffffff" }}
      />

      <h3 style={{
        fontFamily: font, fontSize: 18, fontWeight: 600, color: "var(--cw-ink1)",
        margin: "0 0 4px", letterSpacing: "-.3px",
      }}>
        {firstName ? `¿En qué te ayudo, ${firstName}?` : "¿En qué te ayudo?"}
      </h3>

      <p style={{
        fontFamily: font, fontSize: 13, color: "var(--cw-ink3)",
        margin: "0 0 22px", fontWeight: 400,
      }}>
        {nombrePredio ? `${nombrePredio} · ` : ""}Pregunta sobre tus lotes, animales o finanzas
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {CONTEXT_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => onSuggestionClick(chip)}
            style={{
              fontFamily: "var(--cw-mono)",
              fontSize: 12,
              fontWeight: 500,
              background: "var(--cw-blue)",
              color: "var(--cw-blue-fg)",
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid transparent",
              cursor: "pointer",
              letterSpacing: ".2px",
              transition: "background .12s, border-color .12s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "#dde8f3";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,82,118,.18)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--cw-blue)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
