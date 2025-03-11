import { Test, TestingModule } from '@nestjs/testing';
import { HotelController } from './hotel.controller';
import { HotelService } from './hotel.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/entities/user.enum';
import { ExecutionContext, HttpStatus, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UploadImgService } from '../../libs/upload-img/src/upload-img.service'

describe('HotelController', () => {
  let controller: HotelController;
  let service: HotelService;

  const mockHotelService = {
    create: jest.fn(),
    findAll: jest.fn(),
    searchHotel: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { role: UserRole.ADMIN }; // Simule un utilisateur ADMIN par défaut
      return true;
    }),
  };

  const mockRolesGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      return request.user && request.user.role === UserRole.ADMIN;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelController],
      providers: [
        {
          provide: HotelService,
          useValue: mockHotelService,
        },
        {
          provide: getRepositoryToken(Hotel),
          useValue: {},
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockRolesGuard)
    .compile();

    controller = module.get<HotelController>(HotelController);
    service = module.get<HotelService>(HotelService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new hotel (ADMIN)', async () => {
      const createHotelDto = {
        name: 'Test Hotel',
        street: 'street test',
        location: 'Test Location',
        description: 'Test Description',
        price: 1,
        picture_list: ['test.jpg'],
      };
  
      const createdHotel = { ...createHotelDto, id: 'uuid-v4-format' };
  
      // Simuler la création de l'hôtel
      mockHotelService.create.mockResolvedValue(createdHotel);
  
      const files: Express.Multer.File[] = []; // Si vous n'envoyez pas de fichiers, c'est un tableau vide
      const result = await controller.create(createHotelDto, files);
  
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Hotel successfully created',
        data: createdHotel,
      });
      expect(mockHotelService.create).toHaveBeenCalledWith(createHotelDto, files);
    });
    it('should deny access if not an admin', async () => {
      mockRolesGuard.canActivate.mockReturnValue(false); // Simule un échec de garde pour rôle non ADMIN

      const createHotelDto: CreateHotelDto = {
        name: 'Test Hotel',
        location: 'Test Location',
        description: 'Test Description',
        picture_list: ['test.jpg'],
        street:'street test',
        price:1
      };

      try {
        await controller.create(createHotelDto, []);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
    it('should deny access if not authenticated', async () => {
      mockJwtAuthGuard.canActivate.mockReturnValue(false); // Simule un échec de garde pour authentification
    
      const createHotelDto: CreateHotelDto = { name: 'Test Hotel', location: 'Test Location', description: 'Test Description', picture_list: ['test.jpg'], street:'street test', price: 1};
    
      try {
        await controller.create(createHotelDto, []);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
  });

  describe('findAll', () => {
    it('should return an array of hotels', async () => {
      const hotels = [{ id: '1', name: 'Test Hotel', location: 'Test Location' }];
      mockHotelService.findAll.mockResolvedValue(hotels);

      const result = await controller.findAll(10, 'name', 'ASC');

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Hotels retrieved successfully',
        data: hotels,
      });
      expect(mockHotelService.findAll).toHaveBeenCalledWith(10, 'name', 'ASC');
    });
  });

  describe('search', () => {
    it('should return an array of hotels', async () => {
      const hotels = [{ id: '1', name: 'Test Hotel', location: 'Test Location', description: 'Test Description', picture_list: ['test.jpg'] }];
      mockHotelService.findAll.mockResolvedValue(hotels);
    
      const result = await controller.findAll(10, 'name', 'ASC');
    
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Hotels retrieved successfully',
        data: hotels,
      });
      expect(mockHotelService.findAll).toHaveBeenCalledWith(10, 'name', 'ASC');
    });
  });

  describe('findOne', () => {
    it('should return a single hotel', async () => {
      const id = '1';
      const hotel = { id, name: 'Test Hotel', location: 'Test Location' };
      mockHotelService.findOne.mockResolvedValue(hotel);

      const result = await controller.findOne(id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Hotel retrieved successfully',
        data: hotel,
      });
      expect(mockHotelService.findOne).toHaveBeenCalledWith(id);
    });
  });
  describe('update', () => {
    it('should update a hotel (ADMIN)', async () => {
      const id = '1';
      const updateHotelDto: UpdateHotelDto = {
        name: 'Updated Hotel',
        location: 'Updated Location',
        description: 'Updated Description',
        picture_list: ['updated.jpg'],
      };
      const updatedHotel = { id, ...updateHotelDto };
  
      // Simuler les fichiers uploadés comme un tableau vide
      const files: Express.Multer.File[] = [];
      mockHotelService.update.mockResolvedValue(updatedHotel);
  
      // Appel de la méthode avec un tableau vide pour les fichiers
      const result = await controller.update(id, updateHotelDto, files);
  
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Hotel updated successfully',
        data: updatedHotel,
      });
      expect(mockHotelService.update).toHaveBeenCalledWith(id, updateHotelDto, files);
    });
    it('should deny access if not an admin', async () => {
      mockRolesGuard.canActivate.mockReturnValue(false); // Simule un échec de garde pour rôle non ADMIN

      const id = '1';
      const updateHotelDto: UpdateHotelDto = {
        name: 'Updated Hotel',
        location: 'Updated Location',
        description: 'Updated Description',
        picture_list: ['updated.jpg']
      };

      try {
        await controller.update(id, updateHotelDto, []);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
  });

  describe('remove', () => {
    it('should remove a hotel (ADMIN)', async () => {
      const id = '1';
      mockHotelService.remove.mockResolvedValue(`Hotel with id ${id} deleted`);

      const result = await controller.remove(id);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Hotel deleted successfully',
      });
      expect(mockHotelService.remove).toHaveBeenCalledWith(id);
    });
    it('should deny access if not an admin', async () => {
      mockRolesGuard.canActivate.mockReturnValue(false); // Simule un échec de garde pour rôle non ADMIN

      const id = '1';

      try {
        await controller.remove(id);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
  });
});
