import { ConflictException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string){
    try {
      const ListOfUsers = await this.usersService.searchUser(email);
      const user = ListOfUsers.find((u) => u.email === email);

      if (user && (await bcrypt.compare(pass, user.password))) {
        const { password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      throw new Error('Error during user validation');
    }
  }

  async login(user: any) {
    try {
      const payload = { email: user.email, sub: user.userId, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          pseudo: user.pseudo,
          role: user.role,
        },
      };
    } catch (error) {
      throw new Error('Error during login');
    }
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersService.searchUser(createUserDto.email);
      if (user.length > 0) {
        throw new ConflictException('Email already in use');
      }

      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        Number(process.env.SALT),
      );
      await this.usersService.create({
        ...createUserDto,
        password: hashedPassword,
      });

      return {
        message: 'User created successfully',
      };
    } catch (error) {
      throw new Error(`Error during user registration: ${error.message}`);
    }
  }
}
