import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmartCow",
  description: "Plataforma ganadera SmartCow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
