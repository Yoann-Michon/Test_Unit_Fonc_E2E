import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    try {
      const user = await this.usersService.findOne(email);
  
      if (user && (await bcrypt.compare(pass, user.password))) {
        const { password, ...result } = user;
        return result;
      }
  
      return null;
    } catch (error) {
      throw error;
    }
  }
  

  async login(user: any) {
    try {
      const payload = { email: user.email, sub: user.id, role: user.role, firstname: user.firstname,
        lastname: user.lastname, pseudo:user.pseudo};
      return {
        token: this.jwtService.sign(payload),
        message: 'Login successful',
      };
    } catch (error) {
      throw new Error('Error during login');
    }
  }

  async register(createUserDto: CreateUserDto) {
    try {
      await this.usersService.create(createUserDto)

      return {
        message: 'User created successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error during user registration: ${error.message}`);
    }
  }
}
