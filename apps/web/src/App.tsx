'use client';

import React, { useState, useEffect } from 'react';
import {
  Category,
  CategoryTemplate,
  Listing,
  Requirement,
  Match,
  Deal,
  LedgerEntry,
  AuditLog,
  UserRole,
  Language,
  SEED_CATEGORIES,
  WHEAT_TEMPLATE,
  CHILLI_TEMPLATE,
  POLYMER_TEMPLATE,
  FIXED_CORE_FIELDS,
  matchRequirementToListings,
  calculateDealBreakdown,
  transitionDeal,
  maskDealForBuyer,
  maskDealForSupplier,
} from '@bulkkx/shared';
import { Header } from './components/Header';
import { BuyerView } from './views/BuyerView';
import { SupplierView } from './views/SupplierView';
import { KycModal } from './components/KycModal';

export function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('buyer');
  const [lang, setLang] = useState<Language>('en');
  const [activeNavTab, setActiveNavTab] = useState<string>('explore');
  const [showKycModal, setShowKycModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>(SEED_CATEGORIES);
  const [templates, setTemplates] = useState<Map<string, CategoryTemplate>>(
    new Map([
      [WHEAT_TEMPLATE.id, WHEAT_TEMPLATE],
      [CHILLI_TEMPLATE.id, CHILLI_TEMPLATE],
      [POLYMER_TEMPLATE.id, POLYMER_TEMPLATE],
    ])
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-grains');

  // Supplier & Buyer Parties
  const [supplierParty, setSupplierParty] = useState({
    id: 'sup-001',
    userId: 'usr-sup-1',
    legalName: 'Shree Balaji Agro Traders Pvt Ltd',
    tradeName: 'Balaji Agro Mandi',
    role: 'supplier' as const,
    entityType: 'company' as const,
    phone: '+919829012345',
    email: 'trader@balajiagro.in',
    gstin: '24AAACB9021F1ZX',
    kycStatus: 'verified' as const,
    kycDocuments: [],
    address: {
      line1: 'Shed 12, APMC Market Yard, Gondal Road',
      city: 'Rajkot',
      state: 'Gujarat',
      pincode: '360004',
    },
    createdAt: '',
    updatedAt: '',
  });

  const [buyerParty, setBuyerParty] = useState({
    id: 'buy-001',
    userId: 'usr-buy-1',
    legalName: 'Kalyan Flour Mills & Foods LLP',
    role: 'buyer' as const,
    entityType: 'partnership' as const,
    phone: '+919811098765',
    email: 'procurement@kalyanfoods.com',
    gstin: '07AABCK8741L1Z9',
    kycStatus: 'verified' as const,
    kycDocuments: [],
    buyerTier: 'gold' as const,
    address: {
      line1: 'Industrial Area Phase 2, Okhla',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110020',
    },
    createdAt: '',
    updatedAt: '',
  });

  // Listings with guaranteed price locks
  const [listings, setListings] = useState<Listing[]>([
    {
      id: 'list-001',
      supplierId: 'sup-001',
      categoryId: 'cat-grains',
      templateId: WHEAT_TEMPLATE.id,
      templateVersion: 1,
      attributes: {
        grade: 'Sharbati MP Premium',
        quantity: 100,
        unit: 'MT',
        packaging: 'pp_bags_50kg',
        leadTimeDays: 2,
        lockValidityHours: 24,
        variety: 'sharbati',
        moisturePercent: 11.2,
        foreignMatterPercent: 0.8,
        proteinPercent: 13.5,
      },
      quantityAvailable: 100,
      minOrderQuantity: 10,
      unit: 'MT',
      location: supplierParty.address,
      priceSlabs: [{ minQty: 10, pricePaise: 268000 }],
      lockedPricePaise: 268000,
      lockExpiresAt: new Date(Date.now() + 23 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
      leadTimeDays: 2,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'list-002',
      supplierId: 'sup-001',
      categoryId: 'cat-spices',
      templateId: CHILLI_TEMPLATE.id,
      templateVersion: 1,
      attributes: {
        grade: 'Teja S17 Stemless',
        quantity: 25,
        unit: 'Quintal',
        packaging: 'jute_bags_50kg',
        leadTimeDays: 3,
        lockValidityHours: 36,
        variety: 'teja_s17',
        stemStatus: 'stemless',
        heatPungencySHU: 75000,
        moisturePercent: 9.8,
      },
      quantityAvailable: 25,
      minOrderQuantity: 2,
      unit: 'Quintal',
      location: supplierParty.address,
      priceSlabs: [{ minQty: 2, pricePaise: 1850000 }],
      lockedPricePaise: 1850000,
      lockExpiresAt: new Date(Date.now() + 35 * 3600 * 1000).toISOString(),
      leadTimeDays: 3,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [matches, setMatches] = useState<Match[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [recentNotification, setRecentNotification] = useState<any | null>(null);

  useEffect(() => {
    const initialReq: Requirement = {
      id: 'req-init-1',
      buyerId: 'buy-001',
      categoryId: 'cat-grains',
      specs: { variety: 'sharbati' },
      quantity: 25,
      unit: 'MT',
      deliveryLocation: buyerParty.address,
      neededByDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      targetPricePaise: 270000,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const matchRes = matchRequirementToListings(initialReq, listings, WHEAT_TEMPLATE, 'gold');
    setMatches(matchRes.matches);

    const breakdown = calculateDealBreakdown({
      unitPricePaise: listings[0].lockedPricePaise,
      quantity: 25,
      discountPaise: matchRes.matches[0]?.discountPaise || 350000,
      reservePercentage: 10,
      feePercentage: 2,
    });

    const sampleDeal: Deal = {
      id: 'deal-active-01',
      dealCode: 'BX-2026-9042',
      buyerId: 'buy-001',
      supplierId: 'sup-001',
      listingId: 'list-001',
      requirementId: 'req-init-1',
      categoryId: 'cat-grains',
      unitPricePaise: breakdown.unitPricePaise,
      quantity: breakdown.quantity,
      unit: 'MT',
      totalGoodsValuePaise: breakdown.totalGoodsValuePaise,
      discountPaise: breakdown.discountPaise,
      effectiveTotalPaise: breakdown.effectiveTotalPaise,
      reservePercentage: 10,
      reserveAmountPaise: breakdown.reserveAmountPaise,
      platformFeePaise: breakdown.platformFeePaise,
      state: 'terms_accepted',
      version: 2,
      listingSnapshot: {},
      lockExpiresAt: listings[0].lockExpiresAt,
      stateHistory: [
        {
          fromState: 'matched',
          toState: 'supplier_confirmed',
          event: 'SUPPLIER_CONFIRM',
          actorId: 'sup-001',
          actorRole: 'supplier',
          timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
          note: 'Stock confirmed in Rajkot warehouse',
        },
        {
          fromState: 'supplier_confirmed',
          toState: 'terms_accepted',
          event: 'BUYER_ACCEPT_TERMS',
          actorId: 'buy-001',
          actorRole: 'buyer',
          timestamp: new Date().toISOString(),
          note: 'Buyer accepted deal terms & confirmed 10% Bank Escrow deposit',
        },
      ],
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDeals([sampleDeal]);

    setAuditLogs([
      {
        id: 'audit-boot-01',
        actorId: 'system',
        actorRole: 'admin',
        action: 'BOOTSTRAP_SYSTEM',
        entityType: 'deal',
        entityId: sampleDeal.id,
        after: { dealCode: sampleDeal.dealCode, state: sampleDeal.state },
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const activeCategory = categories.find((c) => c.id === selectedCategory) || categories[0];
  const activeTemplate = activeCategory ? templates.get(activeCategory.activeTemplateId) || null : null;

  const dispatchWhatsAppToast = (templateName: string, params: Record<string, string>, deepLink: string) => {
    setRecentNotification({
      channel: 'whatsapp',
      templateName,
      params,
      deepLink,
    });
  };

  const handlePostRequirement = async (reqData: any) => {
    const newReq: Requirement = {
      id: `req-${Date.now()}`,
      buyerId: 'buy-001',
      categoryId: reqData.categoryId,
      specs: reqData.specs,
      quantity: reqData.quantity,
      unit: 'MT',
      deliveryLocation: buyerParty.address,
      neededByDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      targetPricePaise: reqData.targetPriceInr * 100,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (activeTemplate) {
      const matchRes = matchRequirementToListings(newReq, listings, activeTemplate, 'gold');
      setMatches((prev) => [...matchRes.matches, ...prev]);

      dispatchWhatsAppToast(
        'buyer_matches_found_alert',
        { count: String(matchRes.matches.length), category: activeCategory.name },
        `/shortlist`
      );
    }
  };

  const handleSelectMatchForDeal = async (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    const listing = listings.find((l) => l.id === match.listingId);
    if (!listing) return;

    const breakdown = calculateDealBreakdown({
      unitPricePaise: listing.lockedPricePaise,
      quantity: 25,
      discountPaise: match.discountPaise,
      reservePercentage: 10,
    });

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      dealCode: `BX-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      buyerId: 'buy-001',
      supplierId: listing.supplierId,
      listingId: listing.id,
      requirementId: match.requirementId,
      categoryId: listing.categoryId,
      unitPricePaise: breakdown.unitPricePaise,
      quantity: breakdown.quantity,
      unit: listing.unit,
      totalGoodsValuePaise: breakdown.totalGoodsValuePaise,
      discountPaise: breakdown.discountPaise,
      effectiveTotalPaise: breakdown.effectiveTotalPaise,
      reservePercentage: 10,
      reserveAmountPaise: breakdown.reserveAmountPaise,
      platformFeePaise: breakdown.platformFeePaise,
      state: 'matched',
      version: 1,
      listingSnapshot: {},
      lockExpiresAt: listing.lockExpiresAt,
      stateHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDeals((prev) => [newDeal, ...prev]);

    dispatchWhatsAppToast(
      'supplier_new_order_match',
      { dealCode: newDeal.dealCode, value: `₹${(newDeal.totalGoodsValuePaise / 100).toLocaleString('en-IN')}` },
      `/deals/${newDeal.id}`
    );
  };

  const handleCreateListing = async (listingData: any) => {
    const newListing: Listing = {
      id: `list-${Date.now()}`,
      supplierId: 'sup-001',
      categoryId: listingData.categoryId,
      templateId: activeTemplate?.id || '',
      templateVersion: 1,
      attributes: listingData.attributes,
      quantityAvailable: listingData.quantityAvailable,
      minOrderQuantity: 10,
      unit: 'MT',
      location: supplierParty.address,
      priceSlabs: [{ minQty: 10, pricePaise: listingData.priceInr * 100 }],
      lockedPricePaise: listingData.priceInr * 100,
      lockExpiresAt: new Date(Date.now() + listingData.lockValidityHours * 3600 * 1000).toISOString(),
      leadTimeDays: listingData.leadTimeDays,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setListings((prev) => [newListing, ...prev]);
  };

  const handleRenewLock = async (listingId: string) => {
    setListings((prev) =>
      prev.map((l) =>
        l.id === listingId
          ? {
              ...l,
              lockExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  const handleTriggerDealEvent = async (dealId: string, event: string, payload: any = {}) => {
    const targetDeal = deals.find((d) => d.id === dealId);
    if (!targetDeal) return;

    if (event === 'TRIGGER_PARTNER_WEBHOOK') {
      const webhookPayload = {
        partnerEventId: `evt-${Date.now()}`,
        partnerRef: 'HDFC-ESCROW-00912',
        dealId: targetDeal.id,
        status: 'confirmed' as const,
        amountPaise: targetDeal.reserveAmountPaise,
        signature: 'mock_sig_valid',
      };

      const res = transitionDeal(
        targetDeal,
        'RESERVE_CONFIRMED',
        { id: 'partner_webhook_bot', role: 'admin' },
        { expectedVersion: targetDeal.version, note: 'Reserve verified by HDFC Escrow partner' }
      );

      setDeals((prev) => prev.map((d) => (d.id === dealId ? res.newDeal : d)));
      setAuditLogs((prev) => [res.auditEntry, ...prev]);

      const newLedgerEntry: LedgerEntry = {
        id: `ldg-${Date.now()}`,
        dealId: targetDeal.id,
        account: 'partner_reserve_holding',
        direction: 'DEBIT',
        amountPaise: targetDeal.reserveAmountPaise,
        type: 'reserve_funded',
        idempotencyKey: `idem-${webhookPayload.partnerEventId}`,
        description: `10% Reserve confirmed in Bank Escrow for ${targetDeal.dealCode}. Counterparty identities unmasked.`,
        timestamp: new Date().toISOString(),
      };
      setLedger((prev) => [newLedgerEntry, ...prev]);

      dispatchWhatsAppToast(
        'reserve_confirmed_identities_revealed',
        { dealCode: targetDeal.dealCode, reserveAmount: `₹${(targetDeal.reserveAmountPaise / 100).toLocaleString('en-IN')}` },
        `/deals/${targetDeal.id}`
      );
      return;
    }

    const actor = {
      id: currentRole === 'buyer' ? 'buy-001' : currentRole === 'supplier' ? 'sup-001' : 'ops-001',
      role: currentRole,
    };

    const res = transitionDeal(targetDeal, event as any, actor, payload);
    setDeals((prev) => prev.map((d) => (d.id === dealId ? res.newDeal : d)));
    setAuditLogs((prev) => [res.auditEntry, ...prev]);

    if (res.ledgerMutationsRequired) {
      for (const mut of res.ledgerMutationsRequired) {
        const entry: LedgerEntry = {
          id: `ldg-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          dealId: targetDeal.id,
          account: mut.type === 'reserve_funded' ? 'partner_reserve_holding' : 'bulkkx_fee_revenue',
          direction: mut.type === 'reserve_funded' ? 'DEBIT' : 'CREDIT',
          amountPaise: mut.amountPaise,
          type: mut.type as any,
          idempotencyKey: `idem-${targetDeal.id}-${mut.type}-${res.newDeal.version}`,
          description: mut.description,
          timestamp: new Date().toISOString(),
        };
        setLedger((prev) => [entry, ...prev]);
      }
    }

    dispatchWhatsAppToast(
      'deal_state_stepper_updated',
      { dealCode: targetDeal.dealCode, newState: res.newDeal.state },
      `/deals/${targetDeal.id}`
    );
  };

  const handleApproveMatch = async (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'shortlisted' } : m))
    );
  };

  const handleCreateCategory = async (catData: any) => {
    const categoryId = `cat-${catData.slug}`;
    const templateId = `tmpl-${catData.slug}-v1`;

    const newTemplate: CategoryTemplate = {
      id: templateId,
      categoryId,
      version: 1,
      name: `${catData.name} Standard Spec v1`,
      description: catData.description,
      published: true,
      publishedAt: new Date().toISOString(),
      createdBy: 'ops_admin',
      coreFields: FIXED_CORE_FIELDS,
      categoryFields: catData.categoryFields || [],
    };

    const newCategory: Category = {
      id: categoryId,
      name: catData.name,
      slug: catData.slug,
      description: catData.description,
      activeTemplateId: templateId,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setTemplates((prev) => new Map(prev).set(templateId, newTemplate));
    setCategories((prev) => [...prev, newCategory]);
    setSelectedCategory(categoryId);
  };

  const processedDeals = deals.map((d) => {
    if (currentRole === 'buyer') {
      return maskDealForBuyer(d, supplierParty);
    }
    if (currentRole === 'supplier') {
      return maskDealForSupplier(d, buyerParty);
    }
    return {
      ...d,
      supplier: supplierParty,
      buyer: buyerParty,
      isIdentityRevealed: true,
    };
  });

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-[#141b29] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        lang={lang}
        onLanguageChange={setLang}
        onOpenKyc={() => setShowKycModal(true)}
        isKycVerified={buyerParty.kycStatus === 'verified'}
        activeNavTab={activeNavTab}
        onNavTabChange={setActiveNavTab}
        recentNotification={recentNotification}
        onDismissNotification={() => setRecentNotification(null)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole === 'buyer' && (
          <BuyerView
            categories={categories}
            activeTemplate={activeTemplate}
            onSelectCategory={setSelectedCategory}
            selectedCategory={selectedCategory}
            onPostRequirement={handlePostRequirement}
            matches={matches}
            listings={listings}
            deals={processedDeals as any}
            onSelectMatchForDeal={handleSelectMatchForDeal}
            onTriggerDealEvent={handleTriggerDealEvent}
            lang={lang}
          />
        )}

        {currentRole === 'supplier' && (
          <SupplierView
            categories={categories}
            activeTemplate={activeTemplate}
            onSelectCategory={setSelectedCategory}
            selectedCategory={selectedCategory}
            listings={listings}
            deals={processedDeals as any}
            onCreateListing={handleCreateListing}
            onRenewLock={handleRenewLock}
            onTriggerDealEvent={handleTriggerDealEvent}
          />
        )}

        {currentRole === 'ops' && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 my-8 max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ⚙️
            </div>
            <h3 className="text-lg font-bold text-slate-900">Desktop-First Ops & Admin Console</h3>
            <p className="text-sm text-slate-600">
              Per Section 4 & 12 of the Architecture Plan, the Operations Workbench runs as a dedicated desktop application with dense tables and URL state filtering.
            </p>
            <div className="pt-2">
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Launch Admin Console (Port 3001) →
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Groww-style Clean Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-[#141b29]">Bulkk<span className="text-[#00d09c]">X</span></span>
            <span>·</span>
            <span>Non-Custodial Commodity Matching Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
            <span>Integer Paise Engine</span>
            <span>·</span>
            <span>Append-Only Escrow Ledger</span>
            <span>·</span>
            <span>Zero Buyer Fees</span>
          </div>
        </div>
      </footer>

      {showKycModal && (
        <KycModal
          initialParty={buyerParty}
          onClose={() => setShowKycModal(false)}
          onKycCompleted={(data) => {
            setBuyerParty((prev) => ({ ...prev, ...data }));
            setShowKycModal(false);
          }}
        />
      )}
    </div>
  );
}
