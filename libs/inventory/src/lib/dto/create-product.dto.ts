import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsPositive,
  MaxLength,
  Min,
  IsUrl
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'iPhone 15 Pro',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category!: string;

  @ApiProperty({
    description: 'Product price',
    example: 999.99,
  })
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({
    description: 'Initial quantity in stock',
    example: 10,
  })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone model with advanced features',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/images/product.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Store ID where the product belongs',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  storeId!: string;
}