import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.enum';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { first } from 'rxjs';

const mockUserService = {
  create: jest.fn().mockImplementation((dto) => ({
    id: 1,
    firstname: dto.firstname,
    lastname: dto.lastname,
    email: dto.email,
    password: dto.password,
    role: dto.role,
  })),
  // Autres méthodes mockées...
  update: jest.fn().mockImplementation((id, dto) => ({ id, ...dto })),
  remove: jest.fn().mockResolvedValue({}),
  findAll: jest.fn().mockResolvedValue([
    { id: 1, email: 'user1@example.com', role: UserRole.USER },
    { id: 2, email: 'user2@example.com', role: UserRole.ADMIN },
  ]),
  searchUser: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockImplementation((email) => 
    email === 'test@example.com'
      ? { id: 1, email: 'test@example.com', role: UserRole.USER }
      : null
  ),
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  //////////Create//////////
  it('should create a user with valid data', async () => {
  const dto: CreateUserDto = {
    email: 'validuser@example.com',
    password: 'password123',
    firstname: 'Valid',
    lastname: 'User',
    role: UserRole.USER,
  };

  expect(await controller.create(dto)).toEqual({
    statusCode: 201,
    message: 'User successfully created',
    data: {
      id: 1,
      email: 'validuser@example.com',
      password: 'password123',
      firstname: 'Valid',
      lastname: 'User',
      role: UserRole.USER,
    },
  });
});

// it('should throw an error when creating a user with invalid data (missing email)', async () => {
//   const dto: CreateUserDto = {
//     email: '',
//     password: 'password123',
//     firstname: 'Invalid',
//     lastname: 'User',
//     role: UserRole.USER,
//   };

//   await expect(controller.create(dto)).rejects.toThrow();
// });
  //////////findAll//////////
  it('should retrieve all users', async () => {
    expect(await controller.findAll()).toEqual({
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: [
        { id: 1, email: 'user1@example.com', role: UserRole.USER },
        { id: 2, email: 'user2@example.com', role: UserRole.ADMIN },
      ],
    });
  });
  //////////search//////////
  it('should search for users by query', async () => {
    mockUserService.searchUser.mockResolvedValue([
      { id: 1, email: 'user1@example.com', role: UserRole.USER },
    ]);
    expect(await controller.search('user1')).toEqual({
      statusCode: 200,
      message: 'Users found',
      data: [{ id: 1, email: 'user1@example.com', role: UserRole.USER }],
    });
  });
  //////////findOne//////////
  it('should find one user', async () => {
    expect(await controller.findOne('test@example.com', { user: { email: 'test@example.com', role: UserRole.USER } })).toEqual({
      statusCode: 200,
      message: 'User retrieved successfully',
      data: { id: 1, email: 'test@example.com', role: UserRole.USER },
    });
  });

  it('should throw an error when user is not found', async () => {
    await expect(
      controller.findOne('notfound@example.com', { user: { email: 'admin@example.com', role: UserRole.ADMIN } })
    ).rejects.toThrow(NotFoundException);
  });
  //////////Update//////////
  it('should update a user', async () => {
    const dto: UpdateUserDto = { email: 'updated@example.com' };
    expect(await controller.update('1', dto, { user: { id: '1', role: UserRole.USER } })).toEqual({
      statusCode: 200,
      message: 'User updated successfully',
      data: { id: '1', email: 'updated@example.com' },
    });
  });
  it('should throw an error when user is not found during update', async () => {
    const dto: UpdateUserDto = { email: 'nonexistent@example.com' };
    await expect(
      controller.update('999', dto, { user: { id: '1', role: UserRole.USER } })
    ).rejects.toThrow(ForbiddenException);  // Corrected expected exception
  });
  it('should allow admins to update other users', async () => {
    const dto: UpdateUserDto = { email: 'adminupdated@example.com' };
  
    expect(await controller.update('2', dto, { user: { id: '1', role: UserRole.ADMIN } })).toEqual({
      statusCode: 200,
      message: 'User updated successfully',
      data: { id: '2', email: 'adminupdated@example.com' },
    });
  });
  it('should prevent non-admins from updating other users', async () => {
    await expect(
      controller.update('2', { email: 'hacker@example.com' }, { user: { id: '1', role: UserRole.USER } })
    ).rejects.toThrow(ForbiddenException);  // Corrected expected exception
  });
  it('should prevent users from changing their own roles', async () => {
    await expect(
      controller.update('1', { role: UserRole.ADMIN }, { user: { id: '1', role: UserRole.USER } })
    ).rejects.toThrow(ForbiddenException);  // Corrected expected exception
  });
  it('should allow admins to change user roles', async () => {
    const dto: UpdateUserDto = { role: UserRole.ADMIN };
    expect(await controller.update('1', dto, { user: { id: '1', role: UserRole.ADMIN } })).toEqual({
      statusCode: 200,
      message: 'User updated successfully',
      data: { id: '1', role: UserRole.ADMIN },
    });
  });
  //////////Delete//////////
  it('should delete a user', async () => {
    expect(await controller.remove('1')).toEqual({
      statusCode: 200,
      message: 'User with id 1 deleted successfully',
    });
  });
  // it('should throw NotFoundException when deleting a non-existing user', async () => {
  //   mockUserService.findOne = jest.fn().mockResolvedValue(null); // Simule un utilisateur inexistant
  //   await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
  // });
  
});
