import { ArrayMinSize, IsArray, IsString, Min, MinLength } from 'class-validator';

export class CreateHotelDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @MinLength(3)
  location: string;

  @IsString()
  @MinLength(10)
  description: string;
  
  @IsString()
  @IsArray()
  @ArrayMinSize(1)
  picture_list: string[];
}
