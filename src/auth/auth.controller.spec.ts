import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './../user/user.service'; // Assurez-vous que UserService est importé
import { JwtService } from '@nestjs/jwt'; // Assurez-vous que JwtService est importé
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../user/entities/user.entity';
import { CreateUserDto } from './../user/dto/create-user.dto';
import { UserRole } from './../user/entities/user.enum';

// Créez un mock pour le UserService
const mockUserService = {
  findOne: jest.fn(),
};

const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: {},  // Vous pouvez aussi ajouter des méthodes mockées si nécessaire
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},  // Fournir un mock du UserRepository si nécessaire
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('login', () => {
    it('should return a token and message for valid credentials', async () => {
      const user = { email: 'test@example.com', password: 'validPassword' };
      const validatedUser = { id: '123', email: user.email, role: 'user', firstname: 'John', lastname: 'Doe' };
      const loginResponse = { token: 'testToken', message: 'Login successful' };

      mockAuthService.validateUser.mockResolvedValue(validatedUser);
      mockAuthService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(user);

      expect(result).toEqual(loginResponse);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(user.email, user.password);
      expect(mockAuthService.login).toHaveBeenCalledWith(validatedUser);
    });

    it('should return an error message for invalid credentials', async () => {
      const user = { email: 'test@example.com', password: 'invalidPassword' };

      mockAuthService.validateUser.mockResolvedValue(null);

      const result = await controller.login(user);

      expect(result).toEqual({ message: 'Invalid credentials' });
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(user.email, user.password);
    });
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const createUserDto = { email: 'test@example.com', password: 'validPassword', firstname: 'John', lastname: 'Doe', role : UserRole.USER, pseudo:'pseudo' };
      const registerResponse = { message: 'User created successfully' };

      mockAuthService.register.mockResolvedValue(registerResponse);

      const result = await controller.register(createUserDto);

      expect(result).toEqual(registerResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith(createUserDto);
    });

    it('should return an error message if registration fails', async () => {
      const createUserDto = { email: '', password: 'validPassword', pseudo: 'validPseudo', firstname: 'John', lastname: 'Doe', role : UserRole.USER };
      mockAuthService.register.mockImplementation(() => {
        throw new Error('Error during registration');
      });

      const result = await controller.register(createUserDto);

      expect(result).toEqual({ message: 'Error during registration: Error during registration' });
    });
  });
});
