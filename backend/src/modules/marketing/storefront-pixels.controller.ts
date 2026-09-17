import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetStorefrontPixelsService } from './services/get-storefront-pixels.service';
import { IngestBrowserEventService } from './services/ingest-browser-event.service';
import { IngestEventDto } from './dto/ingest-event.dto';

/**
 * PUBLIC, unauthenticated storefront-facing marketing routes. Anonymous visitors
 * have no JWT — `tenantId` is always resolved server-side from the store slug,
 * never trusted from the client. Mirrors the `tracking` module's public routes.
 */
@ApiTags('Storefront Marketing')
@Controller()
export class StorefrontPixelsController {
  constructor(
    private readonly getStorefrontPixelsService: GetStorefrontPixelsService,
    private readonly ingestBrowserEventService: IngestBrowserEventService,
  ) {}

  @Get('storefront/:slug/pixels')
  @ApiOperation({
    summary: 'Active pixels + page rules for a store (no credential material)',
  })
  @ApiResponse({ status: 200, description: 'Pixels the storefront loader should apply' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStorefrontPixels(@Param('slug') slug: string) {
    return this.getStorefrontPixelsService.execute(slug);
  }

  @Post('marketing/events/ingest')
  @ApiOperation({ summary: 'Browser pixel-event beacon (records a BROWSER event log row)' })
  @ApiResponse({ status: 201, description: 'Event recorded (or silently ignored)' })
  async ingestEvent(@Body() dto: IngestEventDto) {
    return this.ingestBrowserEventService.execute(dto);
  }
}
