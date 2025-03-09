import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { Repository } from 'typeorm';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('HotelService', () => {
  let service: HotelService;
  let repository: Repository<Hotel>;

  const mockHotelRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
    repository = module.get<Repository<Hotel>>(getRepositoryToken(Hotel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new hotel', async () => {
      const createHotelDto: CreateHotelDto = { name: 'Test Hotel', location: 'Test Location', description: 'Test Description', picture_list: ['test.jpg']};
      mockHotelRepository.findOneBy.mockResolvedValue(null);
      mockHotelRepository.save.mockResolvedValue(createHotelDto);

      const result = await service.create(createHotelDto);
      expect(result).toEqual(createHotelDto);
    });

    it('should throw an error if hotel already exists', async () => {
      const createHotelDto: CreateHotelDto = { name: 'Test Hotel', location: 'Test Location', description: 'Test Description', picture_list: ['test.jpg']};
      mockHotelRepository.findOneBy.mockResolvedValue(createHotelDto);

      await expect(service.create(createHotelDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return an array of hotels', async () => {
      const hotels = [{ name: 'Test Hotel', location: 'Test Location' }];
      mockHotelRepository.find.mockResolvedValue(hotels);

      const result = await service.findAll();
      expect(result).toEqual(hotels);
    });

    it('should handle errors', async () => {
      mockHotelRepository.find.mockRejectedValue(new Error('Error retrieving hotels'));
      await expect(service.findAll()).rejects.toThrow(Error);
    });
  });

  describe('searchHotel', () => {
    it('should return an array of hotels matching the query', async () => {
      const query = 'Test';
      const hotels = [{ name: 'Test Hotel', location: 'Test Location' }];
      mockHotelRepository.find.mockResolvedValue(hotels);

      const result = await service.searchHotel(query);
      expect(result).toEqual(hotels);
    });

    it('should handle errors', async () => {
      const query = 'Test';
      mockHotelRepository.find.mockRejectedValue(new Error('Error searching for hotels'));

      await expect(service.searchHotel(query)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    it('should return a single hotel', async () => {
      const id = '1';
      const hotel = { id, name: 'Test Hotel', location: 'Test Location' };
      mockHotelRepository.findOneBy.mockResolvedValue(hotel);

      const result = await service.findOne(id);
      expect(result).toEqual(hotel);
    });

    it('should throw an error if hotel not found', async () => {
      const id = '1';
      mockHotelRepository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle errors', async () => {
      const id = '1';
      mockHotelRepository.findOneBy.mockRejectedValue(new Error('Error finding hotel'));

      await expect(service.findOne(id)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update a hotel', async () => {
      const id = '1';
      const updateHotelDto: UpdateHotelDto = { name: 'Updated Hotel', location: 'Updated Location', description: 'Test Description', picture_list: ['test.jpg'] };
      const existingHotel = { id, name: 'Test Hotel', location: 'Test Location'};
      const updatedHotel = { ...existingHotel, ...updateHotelDto };

      mockHotelRepository.findOneBy.mockResolvedValue(existingHotel);
      mockHotelRepository.update.mockResolvedValue(updatedHotel);
      mockHotelRepository.findOneBy.mockResolvedValue(updatedHotel);

      const result = await service.update(id, updateHotelDto);
      expect(result).toEqual(updatedHotel);
    });

    it('should throw an error if hotel not found', async () => {
      const id = '1';
      const updateHotelDto: UpdateHotelDto = { name: 'Updated Hotel', location: 'Updated Location', description: 'Test Description', picture_list: ['test.jpg'] };

      mockHotelRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(id, updateHotelDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle errors', async () => {
      const id = '1';
      const updateHotelDto: UpdateHotelDto = { name: 'Updated Hotel', location: 'Updated Location', description: 'Test Description', picture_list: ['test.jpg'] };

      mockHotelRepository.findOneBy.mockRejectedValue(new Error('Error updating hotel'));

      await expect(service.update(id, updateHotelDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('should remove a hotel', async () => {
      const id = '1';
      const hotel = { id, name: 'Test Hotel', location: 'Test Location' };

      mockHotelRepository.findOneBy.mockResolvedValue(hotel);
      mockHotelRepository.delete.mockResolvedValue({});

      const result = await service.remove(id);
      expect(result).toEqual(`Hotel with id ${id} deleted`);
    });

    it('should throw an error if hotel not found', async () => {
      const id = '1';

      mockHotelRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(Error);
    });

    it('should handle errors', async () => {
      const id = '1';

      mockHotelRepository.findOneBy.mockRejectedValue(new Error('Error deleting hotel'));

      await expect(service.remove(id)).rejects.toThrow("Error deleting hotel");
    });
  });
});
