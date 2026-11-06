import React from 'react';
import { UserRole } from '@bulkkx/shared';
import { Building2, Factory, Shield, MessageSquare, Bell } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  recentNotification?: {
    channel: string;
    templateName: string;
    params: Record<string, string>;
    deepLink: string;
  } | null;
  onDismissNotification?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  recentNotification,
  onDismissNotification,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-extrabold text-slate-950 text-lg shadow-md shadow-emerald-500/20">
            BX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-slate-100">BulkkX</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                POC v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">India-First Horizontal Commodity Portal</p>
          </div>
        </div>

        {/* Persona / Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => onRoleChange('buyer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              currentRole === 'buyer'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Buyer View</span>
          </button>

          <button
            onClick={() => onRoleChange('supplier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              currentRole === 'supplier'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Supplier View</span>
          </button>

          <button
            onClick={() => onRoleChange('ops')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              currentRole === 'ops'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Ops & Admin</span>
          </button>
        </div>
      </div>

      {/* Simulated WhatsApp Notification Toast */}
      {recentNotification && (
        <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-3 w-full">
            <span className="p-1 rounded bg-emerald-900/60 text-emerald-400 flex items-center gap-1 font-bold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Alert:</span>
            </span>
            <span className="truncate">
              Template: <code className="font-mono text-emerald-300">{recentNotification.templateName}</code> —{' '}
              {JSON.stringify(recentNotification.params)}
            </span>
            <span className="text-emerald-400 font-mono text-[11px] underline ml-auto">
              Deep link: {recentNotification.deepLink}
            </span>
            {onDismissNotification && (
              <button
                onClick={onDismissNotification}
                className="text-slate-400 hover:text-slate-200 text-xs ml-2 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
