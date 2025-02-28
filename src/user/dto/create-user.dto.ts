import { IsEmail, IsEnum, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.enum';


export class CreateUserDto {
    @IsString()
    firstname: string;

    @IsString()
    lastname: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role: UserRole;
}
