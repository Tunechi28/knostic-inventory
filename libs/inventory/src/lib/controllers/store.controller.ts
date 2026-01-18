import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  ValidationPipe,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, AuthPayload } from '@app/auth';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { StoreParamDto } from '../dto/param.dto';
import { StoreService } from '../services/store.service';
import { LoggerService } from '@app/common';

@ApiTags('Store Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(StoreController.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores for the current user' })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of stores owned by the user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listStores(
    @CurrentUser() user: AuthPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.log(`Request to list stores for user ${user.userId} with page=${pageNum}, limit=${limitNum}`);
    return this.storeService.listStores({ userId: user.userId, page: pageNum, limit: limitNum, search });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({
    status: 201,
    description: 'The new store was created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: 409,
    description: 'Store with this name already exists.',
  })
  async createStore(
    @CurrentUser() user: AuthPayload,
    @Body(new ValidationPipe()) createStoreDto: CreateStoreDto,
  ) {
    this.logger.log(
      `Request to create a new store for user ${user.userId} with name ${createStoreDto.name}`,
    );
    return this.storeService.createStore(user.userId, createStoreDto);
  }

  @Get(':storeId')
  @ApiOperation({ summary: 'Get store details' })
  @ApiResponse({ status: 200, description: 'Store details.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async getStore(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: StoreParamDto,
  ) {
    this.logger.log(`Request for store details ${params.storeId} by user ${user.userId}`);
    return this.storeService.getStoreById(user.userId, params.storeId);
  }

  @Patch(':storeId')
  @ApiOperation({ summary: 'Update store details' })
  @ApiResponse({ status: 200, description: 'Store updated successfully.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async updateStore(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: StoreParamDto,
    @Body(new ValidationPipe()) updateStoreDto: UpdateStoreDto,
  ) {
    this.logger.log(
      `Request to update store ${params.storeId} by user ${user.userId}`,
    );
    return this.storeService.updateStore(
      user.userId,
      params.storeId,
      updateStoreDto,
    );
  }

  @Get(':storeId/inventory-value')
  @ApiOperation({ summary: 'Get total inventory value for a store' })
  @ApiResponse({
    status: 200,
    description: 'Total inventory value and breakdown by category.'
  })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async getInventoryValue(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: StoreParamDto,
  ) {
    this.logger.log(`Request for inventory value of store ${params.storeId} by user ${user.userId}`);
    return this.storeService.calculateInventoryValue(user.userId, params.storeId);
  }

  @Get(':storeId/products')
  @ApiOperation({ summary: 'Get all products for a specific store' })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of products for the store.',
  })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getStoreProducts(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: StoreParamDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    this.logger.log(
      `Request for products in store ${params.storeId} by user ${user.userId}`,
    );
    return this.storeService.getStoreProducts(user.userId, params.storeId, {
      page: pageNum,
      limit: limitNum,
      category,
      search,
    });
  }
}
