import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({
    description: 'The name of the store',
    example: 'TechMart Electronics',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

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