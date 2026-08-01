import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateStoreService } from './services/create-store.service';
import { FindStoreByUserService } from './services/find-store-by-user.service';
import { FindStoreBySlugService } from './services/find-store-by-slug.service';
import { UpdateStoreService } from './services/update-store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StoreEntity } from './entities/store.entity';

@ApiTags('Tenant & Stores')
@Controller('stores')
export class TenantController {
  constructor(
    private readonly createStoreService: CreateStoreService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly findStoreBySlugService: FindStoreBySlugService,
    private readonly updateStoreService: UpdateStoreService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new merchant store & tenant organization' })
  @ApiResponse({ status: 201, type: StoreResponseDto, description: 'Store created successfully' })
  async createStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.createStoreService.execute(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active store profile of current logged-in merchant' })
  @ApiResponse({ status: 200, description: 'Store profile details' })
  async getMyStore(@CurrentUser('sub') userId: string): Promise<StoreEntity | null> {
    return this.findStoreByUserService.execute(userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store configuration and courier credentials' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  async updateMyStore(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateStoreDto,
  ): Promise<StoreEntity> {
    return this.updateStoreService.execute(userId, dto);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store details by subdomain slug' })
  @ApiResponse({ status: 200, description: 'Public store profile' })
  async getStoreBySlug(@Param('slug') slug: string): Promise<StoreEntity> {
    return this.findStoreBySlugService.execute(slug);
  }
}
