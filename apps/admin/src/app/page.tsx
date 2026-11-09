'use client';

import React, { useState } from 'react';
import { OpsConsoleView } from '../components/OpsConsoleView';
import { SEED_CATEGORIES, Deal, LedgerEntry, AuditLog, Match } from '@bulkkx/shared';

export default function AdminPage() {
  const [categories, setCategories] = useState(SEED_CATEGORIES);
  const [matches, setMatches] = useState<Match[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'aud_seed_01',
      actorId: 'adm_01',
      actorRole: 'admin',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'category',
      entityId: 'root',
      timestamp: new Date().toISOString(),
      after: { status: 'healthy', version: '1.0.0' },
    },
  ]);

  const handlePublishCategory = (newCat: any, newTmpl: any) => {
    setCategories((prev) => [...prev, newCat]);
    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        actorId: 'adm_01',
        actorRole: 'admin',
        action: 'CATEGORY_PUBLISHED',
        entityType: 'category',
        entityId: newCat.id,
        timestamp: new Date().toISOString(),
        after: newCat,
      },
      ...prev,
    ]);
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white font-black tracking-wider text-xl">
            BX
          </div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              BulkkX Operations Console
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-700">
                Admin Desktop
              </span>
            </h1>
            <p className="text-xs text-slate-400">Zero-Deploy Templates • Matching Override • Escrow Ledger</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <span className="text-xs text-slate-400">Logged in as</span>
            <p className="text-xs font-semibold text-emerald-400">Staff Administrator (Level 3)</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
            SA
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <OpsConsoleView
          categories={categories}
          matches={matches}
          deals={deals}
          ledger={ledger}
          auditLogs={auditLogs}
          onCreateCategory={async (catData: any) => {
            handlePublishCategory(catData, null);
          }}
          onApproveMatch={async () => {}}
          onRefreshData={async () => {}}
        />
      </div>
    </main>
  );
}
