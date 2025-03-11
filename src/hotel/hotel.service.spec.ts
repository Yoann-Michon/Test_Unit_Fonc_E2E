import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { Repository } from 'typeorm';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UploadImgService } from '../../libs/upload-img/src/upload-img.service'

describe('HotelService', () => {
  let service: HotelService;
  let repository: Repository<Hotel>;

  const mockHotelRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn()
  };

  // Mock UploadImgService
const mockUploadImgService = {
  uploadImages: jest.fn(),
};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockHotelRepository,
        },
        {
          provide: UploadImgService,
          useValue: mockUploadImgService, // Providing the mock service
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
      const createHotelDto: CreateHotelDto = {
        name: 'Test Hotel',
        location: 'France',
        description: 'Test Description',
        picture_list: ['test.jpg'],
        street: 'test location',
        price: 1,
      };
    
      mockHotelRepository.findOneBy.mockResolvedValue(null);
      mockHotelRepository.save.mockResolvedValue(createHotelDto);
    
      const mockFile: Express.Multer.File = {
        fieldname: 'image',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test data'), // Simulate the content of the file
        size: 1024,
        stream: {
          read: () => Buffer.from('test data'), // Simulate the data stream
        } as any,  // Simulate a ReadableStream (no need to implement fully)
        destination: '',
        filename: 'test-image.jpg',
        path: '',
      };
    
      const mockFiles: Express.Multer.File[] = [mockFile];
    
      // Mock the uploadImages method to return an array of image URLs
      mockUploadImgService.uploadImages.mockResolvedValue(['https://example.com/test-image.jpg']);
    
      const result = await service.create(createHotelDto, mockFiles);
      
      expect(result).toEqual({
        ...createHotelDto,
        picture_list: ['https://example.com/test-image.jpg'],
      });
    });

    it('should throw an error if hotel already exists', async () => {
      const createHotelDto: CreateHotelDto = { name: 'Test Hotel', location: 'France', description: 'Test Description', picture_list: ['test.jpg'], street: 'test location', price: 1};
      mockHotelRepository.findOneBy.mockResolvedValue(createHotelDto);

      await expect(service.create(createHotelDto, [])).rejects.toThrow(BadRequestException);
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
      const updateHotelDto: UpdateHotelDto = {
        name: 'Updated Hotel',
        location: 'Updated Location',
      };
    
      const existingHotel = {
        id: '1',
        name: 'Test Hotel',
        location: 'France',
        description: 'Test Description',
        picture_list: ['test.jpg'],
        price: 1,
        street: 'test location',
      };
    
      const updatedHotel = {
        ...existingHotel,
        ...updateHotelDto, // Mise à jour avec les nouvelles valeurs
      };
    
      mockHotelRepository.findOneBy.mockResolvedValue(existingHotel);
      mockHotelRepository.save.mockResolvedValue(updatedHotel);
    
      const result = await service.update(id, updateHotelDto);
    
      expect(result).toEqual(expect.objectContaining(updateHotelDto)); // Vérification partielle
    });

    it('should throw an error if hotel not found', async () => {
      const id = '1';
      const updateHotelDto: UpdateHotelDto = { name: 'Updated Hotel', location: 'Updated Location', description: 'Test Description', picture_list: ['test.jpg'] };

      mockHotelRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(id, updateHotelDto)).rejects.toThrow(NotFoundException);
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
