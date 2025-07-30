import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/use-toast";
import { ClerkProvider } from '@clerk/nextjs'


export const metadata: Metadata = {
  title: "Lyzr Chat Support - AI-Powered Customer Support",
  description: "Build and deploy AI-powered customer support chatbots in minutes with Lyzr Chat Support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
