import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BulkkX | Operations & Admin Workbench',
  description: 'Desktop-first operational console for matching overrides, zero-deploy templates, KYC verification, and escrow ledger reconciliation.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
