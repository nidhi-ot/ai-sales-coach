import type { ReactNode } from "react";

export const metadata = {
  title: "AI Sales Coach",
  description: "AI Sales Coach frontend",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
