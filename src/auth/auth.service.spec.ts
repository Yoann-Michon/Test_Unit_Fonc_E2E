import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserRole } from 'src/user/entities/user.enum';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  ///////////////////////////////////////////////////////////////////////////////
  describe('login', () => {
    it('should login successfully', async () => {
      const user = {
        email: 'test@example.com',
        id: '123',
        role: 'user',
        firstname: 'John',
        lastname: 'Doe',
      };

      const mockToken = 'mockToken';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const result = await authService.login(user);

      expect(result).toEqual({
        token: mockToken,
        message: 'Login successful',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
      });
    });
    ///////////////////////////////////////////////////////////////////////////////
    // it('should throw an error if email is invalid', async () => {
    //   const user = {
    //     email: 'invalid@example.com',
    //     password: 'validPassword',
    //   };
    //   // Simulez le cas où l'utilisateur n'existe pas avec cet email
    //   jest.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid password or email')); 
    //   // Vérifiez si l'erreur appropriée est lancée
    //   await expect(authService.login(user)).rejects.toThrow('User not found');
    // });

    it('should throw an error if password is invalid', async () => {
      const user = {
        email: 'valid@example.com',
        password: 'invalidPassword',
      };
      // Simulez ici l'échec de l'authentification dû à un mot de passe incorrect.
      jest.spyOn(authService, 'login').mockRejectedValue(new Error('Invalid password or email'));   
      await expect(authService.login(user)).rejects.toThrow('Invalid password');
    });
    
  });

  ///////////////////////////////////////////////////////////////////////////////
  describe('register', () => {
    it('should register a user successfully with valid email and password', async () => {
      const createUserDto: CreateUserDto = {
        firstname : 'John',
        lastname : 'Doe',
        email: 'test@example.com',
        password: 'validPassword',
        // pseudo: 'Pseudo',
        role : UserRole.USER,
      };

      jest.spyOn(authService, 'register').mockResolvedValue({
        message: 'User created successfully'});
      const result = await authService.register(createUserDto);
      expect(result).toEqual({
        message: 'User created successfully',
      });
    });
  ///////////////////////////////////////////////////////////////////////////////
    // it('should throw an error if email is invalid', async () => {
    //   const createUserDto: CreateUserDto = {
    //     firstname : 'John',
    //     lastname : 'Doe',
    //     email: '', // email invalide
    //     password: 'validPassword',
    //     // pseudo: 'validPseudo',
    //     role : UserRole.USER,
    //   };

    //   jest.spyOn(userService, 'create').mockRejectedValue(new Error('Error during user registration'));

    //   await expect(authService.register(createUserDto)).rejects.toThrow('Error during user registration');
    // });
  });
});
