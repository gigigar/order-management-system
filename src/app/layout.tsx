import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Order Management System",
  description: "Orders for college rings, pins and dog tags.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
