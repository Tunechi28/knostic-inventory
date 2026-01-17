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
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, AuthPayload } from '@app/auth';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateStockDto } from '../dto/update-stock.dto';
import { ProductParamDto } from '../dto/param.dto';
import { ProductService } from '../services/product.service';
import { LoggerService } from '@app/common';

@ApiTags('Product Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(ProductController.name);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for the current user' })
  @ApiResponse({
    status: 200,
    description: 'A paginated list of products owned by the user.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'storeId', required: false, type: String })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean })
  async listProducts(
    @CurrentUser() user: AuthPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
    @Query('lowStock') lowStock?: boolean,
  ) {
    this.logger.log(`Request to list products for user ${user.userId}`);
    return this.productService.listProducts({
      userId: user.userId,
      page,
      limit,
      category,
      search,
      storeId,
      lowStock,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'The new product was created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async createProduct(
    @CurrentUser() user: AuthPayload,
    @Body(new ValidationPipe()) createProductDto: CreateProductDto,
  ) {
    this.logger.log(
      `Request to create a new product by user ${user.userId} with name ${createProductDto.name}`,
    );
    return this.productService.createProduct(user.userId, createProductDto);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product details' })
  @ApiResponse({ status: 200, description: 'Product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async getProduct(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: ProductParamDto,
  ) {
    this.logger.log(`Request for product details ${params.productId} by user ${user.userId}`);
    return this.productService.getProductById(user.userId, params.productId);
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Update product details' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async updateProduct(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: ProductParamDto,
    @Body(new ValidationPipe()) updateProductDto: UpdateProductDto,
  ) {
    this.logger.log(
      `Request to update product ${params.productId} by user ${user.userId}`,
    );
    return this.productService.updateProduct(
      user.userId,
      params.productId,
      updateProductDto,
    );
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async deleteProduct(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: ProductParamDto,
  ) {
    this.logger.log(
      `Request to delete product ${params.productId} by user ${user.userId}`,
    );
    return this.productService.deleteProduct(user.userId, params.productId);
  }

  @Post(':productId/stock')
  @ApiOperation({ summary: 'Update product stock quantity' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  async updateStock(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: ProductParamDto,
    @Body(new ValidationPipe()) updateStockDto: UpdateStockDto,
  ) {
    this.logger.log(
      `Request to update stock for product ${params.productId} by user ${user.userId}`,
    );
    return this.productService.updateStock(
      user.userId,
      params.productId,
      updateStockDto,
    );
  }

  @Get(':productId/history')
  @ApiOperation({ summary: 'Get product stock movement history' })
  @ApiResponse({
    status: 200,
    description: 'Product transaction history.',
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Access forbidden.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getProductHistory(
    @CurrentUser() user: AuthPayload,
    @Param(new ValidationPipe()) params: ProductParamDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    this.logger.log(`Request for product history ${params.productId} by user ${user.userId}`);
    return this.productService.getProductHistory(user.userId, params.productId, {
      page,
      limit,
    });
  }
}
