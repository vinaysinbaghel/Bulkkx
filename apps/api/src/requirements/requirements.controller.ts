import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DbService } from '../db/db.service';
import { requirements } from '../db/schema';
import { AuditService } from '../audit/audit.service';
import { ListingsController } from '../listings/listings.controller';
import { Requirement, matchRequirementToListings, WHEAT_TEMPLATE, POLYMER_TEMPLATE } from '@bulkkx/shared';

@ApiTags('requirements')
@Controller('v1/requirements')
export class RequirementsController {
  private inMemoryRequirements = new Map<string, Requirement>();

  constructor(
    private dbService: DbService,
    private auditService: AuditService,
    private listingsController: ListingsController
  ) {}

  @Post()
  @ApiOperation({ summary: 'Buyer posts commodity requirement with dynamic template spec' })
  async createRequirement(@Body() body: any) {
    const req: Requirement = {
      id: `req_${Date.now()}`,
      buyerId: body.buyerId || 'usr_buyer_01',
      categoryId: body.categoryId || 'cat-grains',
      specs: body.specs || body.spec || {},
      quantity: body.quantity || 50,
      unit: body.unit || 'MT',
      deliveryLocation: body.deliveryLocation || {
        line1: 'MIDC Industrial Area',
        city: 'Bhiwandi',
        state: 'Maharashtra',
        pincode: '421302',
      },
      neededByDate: body.neededByDate || new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
      targetPricePaise: body.targetPricePaise,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.dbService.client.insert(requirements).values({
        id: req.id as any,
        buyerId: req.buyerId as any,
        categoryId: req.categoryId as any,
        spec: req.specs,
        quantity: req.quantity,
        deliveryLocation: req.deliveryLocation,
        neededByDate: new Date(req.neededByDate),
        targetPricePaise: req.targetPricePaise,
      });
    } catch {
      this.inMemoryRequirements.set(req.id, req);
    }

    await this.auditService.log({
      actorRole: 'buyer',
      action: 'REQUIREMENT_POSTED',
      entityType: 'Requirement',
      entityId: req.id,
      afterState: req,
    });

    return req;
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Deterministic explainable matching with discount rules' })
  async getMatches(@Param('id') reqId: string) {
    let req = this.inMemoryRequirements.get(reqId);
    if (!req) {
      req = {
        id: reqId,
        buyerId: 'usr_buyer_01',
        categoryId: 'cat-grains',
        specs: { grade: 'Lokwan Milling Grade', moistureMax: 12 },
        quantity: 50,
        unit: 'MT',
        deliveryLocation: {
          line1: 'MIDC Industrial Area',
          city: 'Bhiwandi',
          state: 'Maharashtra',
          pincode: '421302',
        },
        neededByDate: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const liveListings = (await this.listingsController.getListings()) as any[];
    const template = req.categoryId === 'cat-polymers' ? POLYMER_TEMPLATE : WHEAT_TEMPLATE;
    return matchRequirementToListings(req, liveListings, template, 'silver');
  }
}
