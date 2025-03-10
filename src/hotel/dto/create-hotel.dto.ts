import { ArrayMinSize, IsArray, IsString, Min, MinLength, IsOptional, IsNumber, IsPositive, MaxLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateHotelDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(3)
  street: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  location: string;

  @IsString()
  @MaxLength(500)
  description: string;
  
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  price:number;
  
  @IsString()
  @IsArray()
  @IsOptional()
  picture_list: string[];
}
