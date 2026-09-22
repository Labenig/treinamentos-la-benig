import type { Metadata } from "next";
// Fontes auto-hospedadas via @fontsource (em vez de next/font/google): nao
// dependem de fetch pro Google Fonts em build/runtime, o que e mais robusto
// atras de proxies/firewalls corporativos.
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treinamentos La Benig",
  description: "Plataforma de treinamentos da La Benig",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
