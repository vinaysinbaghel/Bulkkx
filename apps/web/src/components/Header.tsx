import React from 'react';
import { UserRole, Language, TRANSLATIONS } from '@bulkkx/shared';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  User,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenKyc: () => void;
  isKycVerified: boolean;
  activeNavTab: string;
  onNavTabChange: (tab: string) => void;
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
  lang,
  onLanguageChange,
  onOpenKyc,
  isKycVerified,
  activeNavTab,
  onNavTabChange,
  recentNotification,
  onDismissNotification,
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Groww-style Market Indices Bar */}
      <div className="bg-[#fcfdfd] border-b border-gray-100 py-1.5 px-4 overflow-x-auto text-[11px] font-medium text-gray-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-gray-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d09c] animate-pulse"></span>
              LIVE MANDI SPOT:
            </span>
            <div className="flex items-center gap-1 text-gray-800">
              <span className="font-semibold">SHARBATI WHEAT</span>
              <span>₹2,680/MT</span>
              <span className="text-[#00d09c] flex items-center text-[10px]">
                <TrendingUp className="w-3 h-3" /> +1.24%
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-800">
              <span className="font-semibold">GUNTUR RED CHILLI</span>
              <span>₹18,500/Q</span>
              <span className="text-[#eb5b3c] flex items-center text-[10px]">
                <TrendingDown className="w-3 h-3" /> -0.42%
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-800">
              <span className="font-semibold">PP GRANULES (INDUSTRIAL)</span>
              <span>₹94.50/KG</span>
              <span className="text-[#00d09c] flex items-center text-[10px]">
                <TrendingUp className="w-3 h-3" /> +0.85%
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-800">
              <span className="font-semibold">YELLOW MAIZE</span>
              <span>₹2,210/MT</span>
              <span className="text-[#00d09c] flex items-center text-[10px]">
                <TrendingUp className="w-3 h-3" /> +1.50%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-400 text-[11px]">
            <span className="flex items-center gap-1 text-[#00d09c] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Non-Custodial Bank Escrow Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
        {/* Brand Logo & Navigation */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => onNavTabChange('explore')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            {/* Groww-style vibrant gradient mark */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00d09c] via-[#00c598] to-[#2563eb] flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#00d09c]"></div>
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#141b29] font-['Plus_Jakarta_Sans']">
              Bulkk<span className="text-[#00d09c]">X</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#44475b]">
            <button
              onClick={() => onNavTabChange('explore')}
              className={`transition cursor-pointer hover:text-[#00d09c] ${
                activeNavTab === 'explore' ? 'text-[#00d09c] font-semibold' : ''
              }`}
            >
              Commodities
            </button>
            <button
              onClick={() => onNavTabChange('shortlist')}
              className={`transition cursor-pointer hover:text-[#00d09c] ${
                activeNavTab === 'shortlist' ? 'text-[#00d09c] font-semibold' : ''
              }`}
            >
              Direct Matches & Shortlists
            </button>
            <button
              onClick={() => onNavTabChange('deals')}
              className={`transition cursor-pointer hover:text-[#00d09c] ${
                activeNavTab === 'deals' ? 'text-[#00d09c] font-semibold' : ''
              }`}
            >
              Deals & Bank Escrow
            </button>
          </nav>
        </div>

        {/* Search Bar (Groww style) */}
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search commodities, Mandis, grades (e.g. Sharbati, Teja S17)..."
              className="w-full bg-[#f8fafd] border border-gray-200/90 rounded-xl pl-10 pr-14 py-2 text-[13px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#00d09c] focus:ring-2 focus:ring-[#00d09c]/15 transition"
            />
            <span className="absolute right-3 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded shadow-xs">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right Section: Persona switcher + KYC + Language */}
        <div className="flex items-center gap-3">
          {/* Persona View Switcher */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl text-xs font-semibold text-gray-600">
            <button
              onClick={() => onRoleChange('buyer')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentRole === 'buyer'
                  ? 'bg-white text-[#141b29] shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Buyer View
            </button>
            <button
              onClick={() => onRoleChange('supplier')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentRole === 'supplier'
                  ? 'bg-white text-[#141b29] shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Supplier View
            </button>
            <button
              onClick={() => onRoleChange('ops')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentRole === 'ops'
                  ? 'bg-white text-[#141b29] shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Ops Console
            </button>
          </div>

          {/* KYC Status Pill */}
          <button
            onClick={onOpenKyc}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isKycVerified
                ? 'bg-[#e6f9f4] text-[#00a87e] border-[#b2edd9]'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isKycVerified ? 'KYC Verified' : 'Complete KYC'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => onLanguageChange(lang === 'en' ? 'hi' : 'en')}
            className="text-xs font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-xl cursor-pointer bg-white transition"
          >
            {lang === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </div>

      {/* WhatsApp Simulation Banner */}
      {recentNotification && (
        <div className="bg-[#e6f9f4] border-t border-b border-[#b2edd9] px-4 py-2 text-xs text-[#00a87e] flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-3 w-full">
            <span className="p-1 rounded-full bg-[#00d09c] text-white flex items-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-gray-800">
              WhatsApp Alert: <code className="font-mono text-[#008f6b]">{recentNotification.templateName}</code>
            </span>
            <span className="text-gray-600 truncate hidden sm:inline">
              {JSON.stringify(recentNotification.params)}
            </span>
            <span className="ml-auto text-xs font-semibold underline text-[#008f6b] cursor-pointer">
              Open Deal Deep Link
            </span>
            {onDismissNotification && (
              <button
                onClick={onDismissNotification}
                className="text-gray-400 hover:text-gray-600 text-xs ml-2 cursor-pointer font-bold"
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
