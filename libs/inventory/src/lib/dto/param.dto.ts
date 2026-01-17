import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class StoreParamDto {
  @ApiProperty({ description: 'The unique identifier of a store.' })
  @IsUUID()
  @IsNotEmpty()
  storeId!: string;
}

export class ProductParamDto {
  @ApiProperty({ description: 'The unique identifier of a product.' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;
}

export class UuidParamDto {
  @ApiProperty({ description: 'A standard UUID.' })
  @IsUUID()
  id!: string;
}
