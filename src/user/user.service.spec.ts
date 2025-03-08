import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
//chat
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
const mockAdmin: User = {
  id: '1',
  firstname: 'Admin',
  lastname: 'ADMIN',
  email: 'admin@example.com',
  password: 'adminPassword',
  role: UserRole.ADMIN,
  bookings: [],
};


const mockUser: User = {
  id: '2',
  firstname: 'Valid',
  lastname: 'User',
  email: 'user@example.com',
  password: 'userPassword',
  role: UserRole.USER,
  bookings: [],
};


describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
