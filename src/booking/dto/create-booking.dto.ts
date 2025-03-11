import { IsDateString, IsNotEmpty, IsString } from "class-validator";

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @IsDateString()
  @IsNotEmpty()
  checkInDate: Date;

  @IsDateString()
  @IsNotEmpty()
  checkOutDate: Date;
}
