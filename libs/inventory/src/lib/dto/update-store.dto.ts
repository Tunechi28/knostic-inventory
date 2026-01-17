import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateStoreDto {
  @ApiProperty({
    description: 'The name of the store',
    example: 'TechMart Electronics',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    description: 'Description of the store',
    example: 'Electronics and gadgets retailer',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Physical address of the store',
    example: '123 Main Street, City, State',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;
}