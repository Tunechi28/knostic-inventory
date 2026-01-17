import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';

export enum StockUpdateType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class UpdateStockDto {
  @ApiProperty({
    description: 'Type of stock update',
    example: StockUpdateType.STOCK_IN,
    enum: StockUpdateType,
  })
  @IsEnum(StockUpdateType)
  type!: StockUpdateType;

  @ApiProperty({
    description: 'Quantity to add or remove',
    example: 5,
  })
  @IsNumber()
  quantity!: number;

  @ApiProperty({
    description: 'Description of the stock update',
    example: 'Received new shipment',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}