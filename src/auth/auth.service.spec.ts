import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';  // Si vous l'utilisez dans AuthService
import { UserService } from '../user/user.service';  // Si AuthService dépend de UserService

describe('AuthService', () => {
  let service: AuthService;

  // Créez des mocks des services utilisés dans AuthService
  const mockUserService = {
    // Ajoutez ici des méthodes mock si nécessaire
    findOne: jest.fn().mockResolvedValue({ email: 'test@example.com', password: 'hashedPassword' }),
  };

  const mockJwtService = {
    // Ajoutez ici des méthodes mock si nécessaire
    sign: jest.fn().mockReturnValue('mockedToken'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },  // Ajoutez UserService mocké
        { provide: JwtService, useValue: mockJwtService },    // Ajoutez JwtService mocké
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
