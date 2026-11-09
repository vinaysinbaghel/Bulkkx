import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DbService } from '../db/db.service';
import { listings } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import { Listing } from '@bulkkx/shared';

@ApiTags('listings')
@Controller('v1/listings')
export class ListingsController {
  private inMemoryListings: Listing[] = [];

  constructor(
    private dbService: DbService,
    private auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all live listings with active price locks' })
  async getListings(@Query('categoryId') categoryId?: string) {
    try {
      const records = await this.dbService.client.select().from(listings);
      if (records.length > 0) return records;
    } catch {
      // Fallback
    }
    return this.inMemoryListings;
  }

  @Post()
  @ApiOperation({ summary: 'Supplier submits listing with locked price & validity window' })
  async createListing(@Body() body: any) {
    const lockExpiresAt = new Date(Date.now() + (body.lockWindowHours || 24) * 3600 * 1000).toISOString();

    const newListing: Listing = {
      id: `lst_${Date.now()}`,
      supplierId: body.supplierId || 'usr_supplier_01',
      categoryId: body.categoryId || 'cat-grains',
      templateId: body.templateId || 'tmpl-wheat-v1',
      templateVersion: body.templateVersion || 1,
      attributes: body.attributes || {},
      quantityAvailable: body.quantity || 100,
      minOrderQuantity: body.minOrderQuantity || 10,
      unit: body.unit || 'MT',
      location: body.location || {
        line1: 'APMC Market Yard',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001',
      },
      priceSlabs: body.priceSlabs || [],
      lockedPricePaise: body.lockedPricePaise || 245000,
      lockExpiresAt,
      leadTimeDays: body.leadTimeDays || 3,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.dbService.client.insert(listings).values({
        id: newListing.id as any,
        supplierId: newListing.supplierId as any,
        categoryId: newListing.categoryId as any,
        templateVersion: newListing.templateVersion,
        attributes: newListing.attributes,
        quantity: newListing.quantityAvailable,
        availableQuantity: newListing.quantityAvailable,
        minOrderQuantity: newListing.minOrderQuantity,
        unit: newListing.unit,
        location: newListing.location,
        priceSlabs: newListing.priceSlabs,
        lockedPricePaise: newListing.lockedPricePaise,
        lockWindowHours: body.lockWindowHours || 24,
        lockExpiresAt: new Date(newListing.lockExpiresAt),
        leadTimeDays: newListing.leadTimeDays,
        status: newListing.status,
      });
    } catch {
      this.inMemoryListings.push(newListing);
    }

    await this.auditService.log({
      actorRole: 'supplier',
      action: 'LISTING_CREATED',
      entityType: 'Listing',
      entityId: newListing.id,
      afterState: newListing,
    });

    return newListing;
  }
}
