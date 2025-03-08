import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './../user/user.service'; // Assurez-vous que UserService est importé
import { JwtService } from '@nestjs/jwt'; // Assurez-vous que JwtService est importé
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './../user/entities/user.entity';

// Créez un mock pour le UserService
const mockUserService = {
  // Ajoutez des méthodes mock ici si nécessaire
  findOne: jest.fn().mockResolvedValue({ username: 'test', password: 'password' }),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),  // Fournir un mock du UserRepository si nécessaire
          useValue: {},  // Vous pouvez aussi ajouter des méthodes mockées si nécessaire
        },
        {
          provide: UserService,  // Fournir le mock du UserService
          useValue: mockUserService,  // Fournir la valeur mockée
        },
        JwtService,  // Ajoutez JwtService ici
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
