import { Controller, Request, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Public } from './guard/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'password',
      },
    },
  })
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
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        id: '1',
        email: 'user@example.com',
        firstname: 'John',
        lastname: 'Doe',
        role: 'user',
        pseudo: 'Jonny'
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'password',
        firstname: 'John',
        lastname: 'Doe',
        pseudo: 'Jonny'
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return this.authService.register(createUserDto);
    } catch (error) {
      return { message: 'Error during registration: ' + error.message };
    }
  }
}