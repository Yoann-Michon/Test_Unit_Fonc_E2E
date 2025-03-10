import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export enum UserRole {ADMIN = 'admin', USER = 'user'}

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
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
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
  //////////create//////////
  describe('create', () => {
    it('should create and return a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstname: 'John',
        lastname: 'Doe',
        role: UserRole.ADMIN
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      // jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...createUserDto,
        password: 'hashedPassword',
      } as User);

      const result = await service.create(createUserDto);

      expect(result).toMatchObject({
        email: 'test@example.com',
        password: 'hashedPassword',
        firstname: 'John',
        lastname: 'Doe',
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw  InternalServerErrorException if user already exists', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue({ id: '123' } as User);

      await expect(service.create({ email: 'test@example.com', password: 'password123' } as CreateUserDto))
        .rejects.toThrow(InternalServerErrorException);
    });
    // it('should throw InternalServerErrorException if email is invalid', async () => {
    //   await expect(service.create({ email: 'invalidemail', password: 'password123' } as CreateUserDto))
    //     .rejects.toThrow(InternalServerErrorException);
    // });
  });
  //////////findOne//////////
  describe('findOne', () => {
    it('should return a user', async () => {
      const user: User = { id: '1', email: 'test@example.com' } as User;
      jest.spyOn(repository, 'findOne').mockResolvedValue(user);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(user);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne('notfound@example.com');

      expect(result).toBeNull();
    });
  });
  //////////Update//////////
  describe('update', () => {
    it('should update and return the updated user', async () => {
      const user: User = { id: '1', email: 'test@example.com' } as User;
      const updateUserDto: UpdateUserDto = { firstname: 'Updated' };

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(user);
      jest.spyOn(repository, 'save').mockResolvedValue({ ...user, ...updateUserDto });

      const result = await service.update('1', updateUserDto);

      expect(result).toMatchObject({ firstname: 'Updated' });
      expect(repository.save).toHaveBeenCalledWith({ ...user, ...updateUserDto });
    });

    it('should throw InternalServerErrorException if user not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.update('1', { firstname: 'Updated' } as UpdateUserDto))
        .rejects.toThrow(InternalServerErrorException);
    });
  });
  //////////remove//////////
  describe('remove', () => {
    it('should delete the user and return confirmation message', async () => {
      const user: User = { id: '1', email: 'test@example.com' } as User;

      jest.spyOn(repository, 'findOneBy').mockResolvedValue(user);
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('1');

      expect(result).toBe('User with id 1 deleted');
      expect(repository.delete).toHaveBeenCalledWith({ id: '1' });
    });

    it('should throw InternalServerErrorException if user is not found', async () => {
      jest.spyOn(repository, 'findOneBy').mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(InternalServerErrorException);
    });
  });
});