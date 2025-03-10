import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.enum';


export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    firstname: string;

    @IsString()
    @IsNotEmpty()
    @Length(2,50)
    lastname: string;

    @IsEmail()
    @IsNotEmpty()
    @Length(2,50)
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(2,50)
    pseudo:string;

    @IsString()
    @IsNotEmpty()
    @Length(8,30)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role: UserRole;
}
