
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";// Adjust path if needed
import { Toaster } from "@/components/ui/toaster";
import { ReactNode } from 'react';
import CustomTourProvider from "@/components/tour/tour-provider"; import NextAuthProvider from "@/components/providers/NextAuthProvider";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Metadata can remain largely the same or be made dynamic later
export const metadata: Metadata = {
  title: 'AgriCad',
  description: 'Platformă de Gestionare a Terenurilor Agricole',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body>
        <NextAuthProvider>
          {/* AICI e important: CustomTourProvider învelește children */}
          <CustomTourProvider>
            {children}
            <Toaster />
          </CustomTourProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}