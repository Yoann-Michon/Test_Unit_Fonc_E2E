import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HotelService } from '../hotel/hotel.service';
import { User } from '../user/entities/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { UserRole } from '../user/entities/user.enum';
import { Hotel } from '../hotel/entities/hotel.entity';
import { UploadImgService } from '../../libs/upload-img/src/upload-img.service'
import { UserService } from '../user/user.service';

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: Repository<Booking>;

  const mockHotelService = {
    findOne: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn().mockResolvedValue({ id: 'userId', role: UserRole.USER }),
    findOneById: jest.fn().mockResolvedValue({ id: 'userId', role: UserRole.USER }),  // Add this mock for findOneById
  };

  const mockBookingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: HotelService,
          useValue: mockHotelService,
        },
        {
          provide: UserService,  // Add the mock for UserService here
          useValue: mockUserService,
        },
      ],
    }).compile();
  
    service = module.get<BookingService>(BookingService);
    bookingRepository = module.get<Repository<Booking>>(getRepositoryToken(Booking));
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const createBookingDto: CreateBookingDto = {
        hotelId: '1',
        userId: '1',
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };
      const hotel = { id: 'hotelId', name: 'Test Hotel', location: 'Test Location' } as Hotel;
      const booking = {
        id: 'bookingId',
        checkInDate: new Date(createBookingDto.checkInDate),
        checkOutDate: new Date(createBookingDto.checkOutDate),
        user,
        hotel,
        createdAt: new Date(),
      } as Booking;

      mockHotelService.findOne.mockResolvedValue(hotel);
      mockBookingRepository.create.mockReturnValue(booking);
      mockBookingRepository.save.mockResolvedValue(booking);

      const result = await service.create(createBookingDto, user.id);

      expect(result).toEqual(booking);
      expect(mockHotelService.findOne).toHaveBeenCalledWith(createBookingDto.hotelId);
      expect(mockBookingRepository.create).toHaveBeenCalledWith({
        user,
        hotel,
        checkInDate: new Date(createBookingDto.checkInDate),
        checkOutDate: new Date(createBookingDto.checkOutDate),
      });
      expect(mockBookingRepository.save).toHaveBeenCalledWith(booking);
    });
    it('should throw an error if hotel not found', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const createBookingDto: CreateBookingDto = { hotelId: 'nonexistentHotelId', userId :'1',  checkInDate: new Date(), checkOutDate: new Date() };

      mockHotelService.findOne.mockResolvedValue(null);

      await expect(service.create(createBookingDto, user.id)).rejects.toThrow(InternalServerErrorException);
      expect(mockHotelService.findOne).toHaveBeenCalledWith(createBookingDto.hotelId);
    });
  });

  describe('findAll', () => {
    it('should return an array of bookings for admin', async () => {
      const bookings = [{ id: 'bookingId', user: { id: 'userId' }, hotel: { id: 'hotelId' } }];
      mockBookingRepository.find.mockResolvedValue(bookings);

      const result = await service.findAll({ id: 'adminId', role: UserRole.ADMIN } as User, true);

      expect(result).toEqual(bookings);
      expect(mockBookingRepository.find).toHaveBeenCalledWith({ relations: ['user', 'hotel'] });
    });

    it('should return an array of user bookings', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const bookings = [{ id: 'bookingId', hotel: { id: 'hotelId' } }];
      mockBookingRepository.find.mockResolvedValue(bookings);

      const result = await service.findAll(user);

      expect(result).toEqual(bookings);
      expect(mockBookingRepository.find).toHaveBeenCalledWith({ where: { user: { id: user.id } }, relations: ['hotel'] });
    });

    it('should handle errors', async () => {
      mockBookingRepository.find.mockRejectedValue(new Error('Error retrieving bookings'));

      await expect(service.findAll({ id: 'adminId', role: UserRole.ADMIN } as User, true)).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('should return a single booking for admin', async () => {
      const booking = { id: 'bookingId', user: { id: 'userId' }, hotel: { id: 'hotelId' } };
      mockBookingRepository.findOne.mockResolvedValue(booking);

      const result = await service.findOne('bookingId', { id: 'adminId', role: UserRole.ADMIN } as User, true);

      expect(result).toEqual(booking);
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({ where: { id: 'bookingId' }, relations: ['user', 'hotel'] });
    });

    it('should return a single booking for the user', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const booking = { id: 'bookingId', user, hotel: { id: 'hotelId' } };
      mockBookingRepository.findOne.mockResolvedValue(booking);

      const result = await service.findOne('bookingId', user);

      expect(result).toEqual(booking);
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({ where: { id: 'bookingId' }, relations: ['user', 'hotel'] });
    });

    it('should throw an error if booking not found', async () => {
      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistentBookingId', { id: 'userId', role: UserRole.USER } as User)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw an error if user is not authorized to access booking', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const anotherUser: User = { id: 'anotherUserId', role: UserRole.USER } as User;
      const booking = { id: 'bookingId', user: anotherUser, hotel: { id: 'hotelId' } };
      mockBookingRepository.findOne.mockResolvedValue(booking);

      await expect(service.findOne('bookingId', user)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update a booking (ADMIN)', async () => {
      const user: User = { id: 'adminId', role: UserRole.ADMIN } as User;
      const updateBookingDto: UpdateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };
      const booking = { id: 'bookingId', user: { id: 'userId' }, hotel: { id: 'hotelId' }, ...updateBookingDto };

      mockBookingRepository.findOne.mockResolvedValue(booking);
      mockBookingRepository.save.mockResolvedValue(booking);

      const result = await service.update(user, 'bookingId', updateBookingDto);

      expect(result).toEqual(booking);
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({ where: { id: 'bookingId' }, relations: ['user'] });
      expect(mockBookingRepository.save).toHaveBeenCalledWith({ ...booking, ...updateBookingDto });
    });

    it('should deny access if not admin or owner', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const anotherUser: User = { id: 'anotherUserId', role: UserRole.USER } as User;
      const booking = { id: 'bookingId', user: anotherUser, hotel: { id: 'hotelId' } };

      mockBookingRepository.findOne.mockResolvedValue(booking);

      const updateBookingDto: UpdateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };

      await expect(service.update(user, 'bookingId', updateBookingDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle errors', async () => {
      const user: User = { id: 'adminId', role: UserRole.ADMIN } as User;
      const updateBookingDto: UpdateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };

      mockBookingRepository.findOne.mockRejectedValue(new Error('Error updating booking'));

      await expect(service.update(user, 'bookingId', updateBookingDto)).rejects.toThrow(InternalServerErrorException);
    });
  });
  describe('remove', () => {
    it('should remove a booking (ADMIN)', async () => {
      const user: User = { id: 'adminId', role: UserRole.ADMIN } as User;
      const booking = { id: 'bookingId', user: { id: 'userId' }, hotel: { id: 'hotelId' } } as Booking;

      mockBookingRepository.findOne.mockResolvedValue(booking);
      mockBookingRepository.delete.mockResolvedValue({});

      const result = await service.remove('bookingId', user, true);

      expect(result).toEqual(`Booking with id bookingId deleted`);
      expect(mockBookingRepository.findOne).toHaveBeenCalledWith({ where: { id: 'bookingId' }, relations: ['user', 'hotel'] });
      expect(mockBookingRepository.delete).toHaveBeenCalledWith({ id: 'bookingId' });
    });

    it('should deny access if not admin or owner', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const anotherUser: User = { id: 'anotherUserId', role: UserRole.USER } as User;
      const booking = { id: 'bookingId', user: anotherUser, hotel: { id: 'hotelId' } } as Booking;

      mockBookingRepository.findOne.mockResolvedValue(booking);

      await expect(service.remove('bookingId', user)).rejects.toThrow(Error);
    });

    it('should handle errors', async () => {
      const user: User = { id: 'adminId', role: UserRole.ADMIN } as User;

      mockBookingRepository.findOne.mockRejectedValue(new Error('Error deleting booking'));

      await expect(service.remove('bookingId', user, true)).rejects.toThrow(Error);
    });
  });
  describe('Access Control', () => {
    it('should deny access if user is not admin or owner (CREATE)', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const createBookingDto: CreateBookingDto = { hotelId: 'hotelId',userId : '1' ,checkInDate: new Date(), checkOutDate: new Date() };

      try {
        await service.create(createBookingDto, user.id);
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('should deny access if user is not admin or owner (UPDATE)', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const anotherUser: User = { id: 'anotherUserId', role: UserRole.USER } as User;
      const booking = { id: 'bookingId', user: anotherUser, hotel: { id: 'hotelId' } } as Booking;

      mockBookingRepository.findOne.mockResolvedValue(booking);
      const updateBookingDto: UpdateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };

      try {
        await service.update(user, 'bookingId', updateBookingDto);
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('should deny access if user is not admin or owner (REMOVE)', async () => {
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const anotherUser: User = { id: 'anotherUserId', role: UserRole.USER } as User;
      const booking = { id: 'bookingId', user: anotherUser, hotel: { id: 'hotelId' } } as Booking;

      mockBookingRepository.findOne.mockResolvedValue(booking);

      try {
        await service.remove('bookingId', user);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});

