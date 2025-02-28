import { Controller, Request , Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Public } from './guard/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) {
        return { message: 'Invalid credentials' };
      }

      return this.authService.login(user);
    } catch (error) {
      return { message: 'Error during login: ' + error.message };
    }
  }

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return this.authService.register(createUserDto);
    } catch (error) {
      return { message: 'Error during registration: ' + error.message };
    }
  }
}
