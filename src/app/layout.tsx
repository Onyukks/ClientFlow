import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientFlow | SaaS CRM Dashboard",
  description:
    "A full-stack SaaS CRM dashboard built with Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, Stripe test billing, and automated tests.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
