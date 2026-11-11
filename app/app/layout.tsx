import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meu dinheiro — Controle financeiro pessoal",
  description: "Acompanhe o que ainda pode gastar em cada categoria e cuide das suas metas de reserva.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
