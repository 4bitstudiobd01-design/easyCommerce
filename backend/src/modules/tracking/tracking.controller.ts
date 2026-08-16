import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RecordVisitService } from './services/record-visit.service';
import { TrackVisitDto } from './dto/track-visit.dto';

@ApiTags('Storefront Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly recordVisitService: RecordVisitService) {}

  // --- PUBLIC UNPROTECTED STOREFRONT TRACKING ROUTE ---
  // Anonymous storefront visitors have no JWT; tenantId is always resolved
  // server-side from storeSlug, never trusted from the client.
  @Post('visit')
  @ApiOperation({ summary: 'Record a storefront visit session (beacon, fires once per session)' })
  @ApiResponse({ status: 201, description: 'Visit recorded (or debounced if too recent)' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async trackVisit(@Body() dto: TrackVisitDto) {
    return this.recordVisitService.execute(dto);
  }
}
