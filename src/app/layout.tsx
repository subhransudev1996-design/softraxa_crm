import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/modules/auth/AuthContext';

export const metadata: Metadata = {
  title: 'Softraxa CRM',
  description: 'Next.js + Supabase web panel for managing the full lifecycle of a software company.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
