import { ArrayMinSize, IsArray, IsString, Min, MinLength, IsOptional, IsNumber, IsPositive, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateHotelDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
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
