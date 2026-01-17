import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
  IsUrl
} from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'iPhone 15 Pro',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @ApiProperty({
    description: 'Product price',
    example: 999.99,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  price?: number;

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
}
