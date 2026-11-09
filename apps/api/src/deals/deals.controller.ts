import { Controller, Get, Post, Body, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { ZeroLeakMaskingInterceptor } from '../common/interceptors/masking.interceptor';
import { DealEvent, TransitionPayload } from '@bulkkx/shared';

@ApiTags('deals')
@Controller('v1/deals')
@UseInterceptors(ZeroLeakMaskingInterceptor)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'List all deals with zero-leak identity masking applied' })
  async getAllDeals() {
    return this.dealsService.getAllDeals();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID (supplier masked for buyers before reserve_confirmed)' })
  async getDeal(@Param('id') id: string) {
    return this.dealsService.getDealById(id);
  }

  @Post(':id/events/:event')
  @ApiOperation({ summary: 'Single-source-of-truth Deal state machine event transition' })
  @ApiResponse({ status: 200, description: 'Transition executed successfully' })
  async triggerTransition(
    @Param('id') id: string,
    @Param('event') event: DealEvent,
    @Body() payload: TransitionPayload,
    @Req() req: any
  ) {
    const actorRole = req.user?.role || req.headers['x-user-role'] || 'buyer';
    const actorId = req.user?.id || req.headers['x-user-id'] || 'actor-system';

    return this.dealsService.transition(id, event, { id: actorId, role: actorRole }, payload);
  }
}
