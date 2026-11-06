import { Category, CategoryTemplate, Listing, Requirement, Match, Deal, LedgerEntry, AuditLog } from '../types/domain';

export interface BulkkXClientOptions {
  baseUrl: string;
  getUserId?: () => string;
  getUserRole?: () => string;
}

export class BulkkXApiClient {
  private baseUrl: string;
  private getUserId: () => string;
  private getUserRole: () => string;

  constructor(options: BulkkXClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.getUserId = options.getUserId || (() => 'buy-001');
    this.getUserRole = options.getUserRole || (() => 'buyer');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.getUserId(),
      'x-user-role': this.getUserRole(),
      ...(options.headers || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed', message: res.statusText }));
      throw new Error(err.message || `API error ${res.status}`);
    }
    return res.json();
  }

  // Categories & Templates
  async getCategories(): Promise<{ categories: Category[] }> {
    return this.request<{ categories: Category[] }>('/api/v1/categories');
  }

  async getCategory(id: string): Promise<{ category: Category; activeTemplate: CategoryTemplate }> {
    return this.request<{ category: Category; activeTemplate: CategoryTemplate }>(`/api/v1/categories/${id}`);
  }

  async createCategory(payload: { name: string; slug: string; description?: string; categoryFields?: any[] }) {
    return this.request('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Listings
  async getListings(categoryId?: string): Promise<{ listings: Listing[] }> {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request<{ listings: Listing[] }>(`/api/v1/listings${query}`);
  }

  async createListing(payload: any): Promise<{ listing: Listing }> {
    return this.request<{ listing: Listing }>('/api/v1/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async renewPriceLock(listingId: string, validityHours = 24) {
    return this.request(`/api/v1/listings/${listingId}/renew-lock`, {
      method: 'POST',
      body: JSON.stringify({ validityHours }),
    });
  }

  // Requirements & Matching
  async postRequirement(payload: any): Promise<{ requirement: Requirement; matchCount: number; matches: Match[] }> {
    return this.request('/api/v1/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Deals & State Machine
  async getDeals(): Promise<{ deals: Deal[] }> {
    return this.request<{ deals: Deal[] }>('/api/v1/deals');
  }

  async getDeal(id: string): Promise<{ deal: Deal }> {
    return this.request<{ deal: Deal }>(`/api/v1/deals/${id}`);
  }

  async createDealFromMatch(matchId: string, reservePercentage = 10): Promise<{ deal: Deal }> {
    return this.request<{ deal: Deal }>('/api/v1/deals/from-match', {
      method: 'POST',
      body: JSON.stringify({ matchId, reservePercentage }),
    });
  }

  async transitionDeal(dealId: string, event: string, payload: any = {}): Promise<{ deal: Deal; toState: string }> {
    return this.request(`/api/v1/deals/${dealId}/events/${event}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Webhooks
  async triggerReserveWebhook(payload: { dealId: string; partnerRef: string; amountPaise?: number }) {
    return this.request('/api/v1/webhooks/reserve', {
      method: 'POST',
      body: JSON.stringify({
        partnerEventId: `evt-${Date.now()}`,
        signature: 'mock_sig_valid',
        status: 'confirmed',
        ...payload,
      }),
    });
  }

  // Admin & Ledger
  async getLedger(): Promise<{ ledgerEntries: LedgerEntry[] }> {
    return this.request('/api/v1/admin/ledger');
  }

  async getReconciliation() {
    return this.request('/api/v1/admin/reconciliation');
  }

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return this.request('/api/v1/admin/audit-logs');
  }
}
