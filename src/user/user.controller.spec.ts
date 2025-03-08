import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

// Créez un mock pour le UserRepository
const mockUserRepository = {
  findOne: jest.fn().mockResolvedValue({ id: 1, username: 'test', password: 'password' }),
  save: jest.fn().mockResolvedValue({ id: 1, username: 'test', password: 'password' }),
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),  // Fournir un mock du UserRepository
          useValue: mockUserRepository,  // Fournir la valeur mockée
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
