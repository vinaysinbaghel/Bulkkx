import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { maskDealForBuyer, maskDealForSupplier, Deal, Party } from '@bulkkx/shared';

@Injectable()
export class ZeroLeakMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role || request.headers['x-user-role'] || 'buyer';

    return next.handle().pipe(
      map((data) => {
        if (!data) return data;
        return this.maskDataRecursively(data, userRole);
      })
    );
  }

  private maskDataRecursively(data: any, role: string): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.maskDataRecursively(item, role));
    }

    if (data && typeof data === 'object') {
      // Check if this object represents a Deal (has state, buyerId, supplierId, etc.)
      if ('state' in data && 'supplierId' in data && 'buyerId' in data) {
        const dummySupplierParty: Party = {
          id: data.supplierId,
          userId: data.supplierId,
          legalName: 'Verified Supplier Corp Ltd',
          tradeName: 'Verified Supplier',
          role: 'supplier',
          entityType: 'company',
          phone: '+919876543210',
          email: 'supplier@mandi.internal',
          kycStatus: 'verified',
          kycDocuments: [],
          address: {
            line1: 'APMC Market Yard',
            city: 'Rajkot',
            state: 'Gujarat',
            pincode: '360001',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const dummyBuyerParty: Party = {
          id: data.buyerId,
          userId: data.buyerId,
          legalName: 'National Agri Mills Pvt Ltd',
          tradeName: 'National Agri Mills',
          role: 'buyer',
          entityType: 'company',
          phone: '+919812345678',
          email: 'buyer@mills.internal',
          kycStatus: 'verified',
          kycDocuments: [],
          address: {
            line1: 'MIDC Industrial Area',
            city: 'Bhiwandi',
            state: 'Maharashtra',
            pincode: '421302',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (role === 'buyer') {
          return maskDealForBuyer(data as Deal, dummySupplierParty);
        } else if (role === 'supplier') {
          return maskDealForSupplier(data as Deal, dummyBuyerParty);
        }
      }

      // Recursively mask properties
      const cloned: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        cloned[key] = this.maskDataRecursively(value, role);
      }
      return cloned;
    }

    return data;
  }
}
