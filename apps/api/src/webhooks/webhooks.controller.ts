import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DealsService } from '../deals/deals.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('webhooks')
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(
    private dealsService: DealsService,
    private auditService: AuditService
  ) {}

  @Post('reserve')
  @ApiOperation({ summary: 'Bank / NBFC Partner Reserve confirmation callback webhook' })
  async handleReserveWebhook(
    @Body() body: any,
    @Headers('x-partner-signature') signature?: string
  ) {
    if (!body.dealId || !body.partnerReference) {
      throw new BadRequestException('Missing dealId or partnerReference in webhook payload');
    }

    const { dealId, partnerReference, status, reserveType } = body;

    if (status === 'CONFIRMED') {
      const deal = await this.dealsService.getDealById(dealId);
      const result = await this.dealsService.transition(
        dealId,
        'RESERVE_CONFIRMED',
        { id: 'partner_webhook', role: 'admin' },
        {
          expectedVersion: deal.version,
          note: `Bank Escrow confirmed via partner webhook. Ref: ${partnerReference} (${reserveType || 'cash'})`,
          metadata: { partnerReference, reserveType },
        }
      );

      await this.auditService.log({
        actorRole: 'system',
        action: 'WEBHOOK_RESERVE_CONFIRMED',
        entityType: 'Deal',
        entityId: dealId,
        afterState: { status, partnerReference },
      });

      return { success: true, newDealState: result.newDeal.state };
    }

    return { received: true };
  }
}
