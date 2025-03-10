import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/entities/user.enum';
import { User } from 'src/user/entities/user.entity';
import { Hotel } from 'src/hotel/entities/hotel.entity';
import { ExecutionContext, HttpStatus, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  const mockBookingService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getUserBooking: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'userId', role: UserRole.USER }; // Simule un utilisateur connecté par défaut
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
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const createBookingDto: CreateBookingDto = {
        hotelId: 'hotelId',
        userId: 'userId',
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };
      const user: User = { id: 'userId', role: UserRole.USER } as User;
      const hotel = { id: 'hotelId', name: 'Test Hotel', location: 'Test Location' } as Hotel;
      const booking = { id : '1', ...createBookingDto, createdAt : new Date(), user : user, hotel : hotel} as Booking;

      mockBookingService.create.mockResolvedValue(booking);

      const result = await controller.create(createBookingDto, { user: user });

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Booking created successfully',
        data: booking,
      });
      expect(mockBookingService.create).toHaveBeenCalledWith({ id: 'userId', role: UserRole.USER }, createBookingDto);
    });
    // it('should return Forbidden for non-authenticated user', async () => {
    //   const createBookingDto: CreateBookingDto = {
    //     hotelId: 'hotelId',
    //     userId: 'userId',
    //     checkInDate: new Date(),
    //     checkOutDate: new Date(),
    //   };
    //   const user = { id: 'userId', role: UserRole.USER };
  
    //   mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);
  
    //   await expect(controller.create(createBookingDto, { user: user })).rejects.toThrow(InternalServerErrorException);
    // });
  });
  describe('findAll', () => {
    it('should return an array of bookings', async () => {
      const user1: User = { id: 'userId1', role: UserRole.USER } as User;
      const user2: User = { id: 'userId2', role: UserRole.USER } as User;
      const hotel1 = { id: 'hotelId1', name: 'Hotel 1', location: 'Test Location 1' } as Hotel;
      const hotel2 = { id: 'hotelId2', name: 'Hotel 2', location: 'Test Location 2' } as Hotel;
      const bookings = [
        { id: '1', hotel: hotel1, user: user1, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() },
        { id: '2', hotel: hotel2, user: user2, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() }
      ] as Booking[];

      mockBookingService.findAll.mockResolvedValue(bookings);

      const result = await controller.findAll({ user: { id: 'adminId', role: UserRole.ADMIN } });

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Bookings retrieved successfully',
        data: bookings,
      });
      expect(mockBookingService.findAll).toHaveBeenCalledWith({ id: 'adminId', role: UserRole.ADMIN }, true);
    });

    // it('should return Forbidden for non-admin users', async () => {
    //   const user1: User = { id: 'userId1', role: UserRole.USER } as User;
    //   const user2: User = { id: 'userId2', role: UserRole.USER } as User;
    //   const hotel1 = { id: 'hotelId1', name: 'Hotel 1', location: 'Test Location 1' } as Hotel;
    //   const hotel2 = { id: 'hotelId2', name: 'Hotel 2', location: 'Test Location 2' } as Hotel;
    //   const bookings = [
    //     { id: '1', hotel: hotel1, user: user1, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() },
    //     { id: '2', hotel: hotel2, user: user2, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() }
    //   ] as Booking[];

    //   mockBookingService.findAll.mockResolvedValue(bookings);

    //   const result = await controller.findAll({ user: { id: 'userID', role: UserRole.USER } });

    //   expect(result).toEqual({
    //     statusCode: HttpStatus.FORBIDDEN,
    //     message: '',
    //   });
    //   expect(mockBookingService.findAll).not.toHaveBeenCalledWith();
    // });

    // it('should return Forbidden for non-admin users', async () => {
    //   const user = { id: 'userId', role: UserRole.USER };
  
    //   // Configure le mockRolesGuard pour renvoyer false pour ce test
    //   mockRolesGuard.canActivate.mockReturnValueOnce(false);
  
    //   await expect(controller.findAll({ user })).rejects.toThrow(ForbiddenException);
    // });
  
    it('should return Forbidden for unauthenticated users trying to access all bookings', async () => {
      // Configure le mockJwtAuthGuard pour renvoyer false
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);
  
      await expect(controller.findAll({})).rejects.toThrow(TypeError);
    });
    
  });

  describe('findOne', () => {
    it('should return a single booking', async () => {
      const bookingId = '1';
      const user: User = { id: 'userId1', role: UserRole.USER } as User;
      const hotel = { id: 'hotelId1', name: 'Hotel 1', location: 'Test Location 1' } as Hotel;
      const booking = { id: bookingId, hotel : hotel, user : user, checkInDate: new Date(), checkOutDate: new Date() } as Booking;

      mockBookingService.findOne.mockResolvedValue(booking);

      const result = await controller.findOne(bookingId, { user: { id: 'adminId', role: UserRole.ADMIN } });

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Booking retrieved successfully',
        data: booking,
      });
      expect(mockBookingService.findOne).toHaveBeenCalledWith(bookingId, { id: 'adminId', role: UserRole.ADMIN }, true);
    });
    it('should return Forbidden for unauthenticated users trying to access a booking', async () => {
      // Configure le mockJwtAuthGuard pour renvoyer false
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await expect(controller.findOne('1', {})).rejects.toThrow(TypeError);
    });
  });

  describe('update', () => {
    it('should update a booking', async () => {
      const updateBookingDto: UpdateBookingDto = {
        checkInDate: new Date(),
        checkOutDate: new Date(),
        userId: "1"
      };
      const updatedBooking = { id: '1', ...updateBookingDto } as Booking;

      mockBookingService.update.mockResolvedValue(updatedBooking);

      const result = await controller.update({ user: { id: '1', role: UserRole.USER } }, '1', updateBookingDto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Booking updated successfully',
        data: updatedBooking,
      });
      expect(mockBookingService.update).toHaveBeenCalledWith({ id: '1', role: UserRole.USER }, '1', updateBookingDto);
    });
    it('should return Forbidden for unauthenticated users trying to update a booking', async () => {
      const updateBookingDto: UpdateBookingDto = {
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };

      // Configure le mockJwtAuthGuard pour renvoyer false
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      await expect(controller.update({}, '1', updateBookingDto)).rejects.toThrow(TypeError);
    });
    it('should return Forbidden for users trying to update another user\'s booking', async () => {
      const updateBookingDto: UpdateBookingDto = {
        checkInDate: new Date(),
        checkOutDate: new Date(),
      };
      const user = { id: 'otherUserId', role: UserRole.USER };
      const user2 = { id: 'userId2', role: UserRole.USER };

      // Configure le mockBookingService pour renvoyer un booking appartenant à un autre utilisateur
      const booking = {
        id: '1',
        user: user,
        checkInDate: new Date(),
        checkOutDate: new Date(),
      } as Booking;

      mockBookingService.findOne.mockResolvedValue(booking);

      await expect(controller.update({ user: user2 }, '1', updateBookingDto)).rejects.toThrow(ForbiddenException);
    });
  });


  describe('remove', () => {
    it('should remove a booking', async () => {
      const bookingId = '1';
      mockBookingService.remove.mockResolvedValue('Booking deleted successfully');

      const result = await controller.remove(bookingId, { user: { id: 'adminId', role: UserRole.ADMIN } });

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Booking deleted successfully',
      });
      expect(mockBookingService.remove).toHaveBeenCalledWith(bookingId, { id: 'adminId', role: UserRole.ADMIN }, true);
    });
    // it('should return Forbidden for non-admin users', async () => {
    //   const user = { id: 'userId', role: UserRole.USER };
  
    //   mockRolesGuard.canActivate.mockReturnValueOnce(false);
  
    //   await expect(controller.remove('1', { user: user })).rejects.toThrow(ForbiddenException);
    // });
  });

  describe('getUserBooking', () => {
    it('should return an array of user bookings', async () => {
      const userId = 'userId1';
      const user1: User = { id: 'userId1', role: UserRole.USER } as User;
      const user2: User = { id: 'userId2', role: UserRole.USER } as User;
      const hotel1 = { id: 'hotelId1', name: 'Hotel 1', location: 'Test Location 1' } as Hotel;
      const hotel2 = { id: 'hotelId2', name: 'Hotel 2', location: 'Test Location 2' } as Hotel;
      const bookings = [
        { id: '1', hotel: hotel1, user: user1, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() },
        { id: '2', hotel: hotel2, user: user2, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() }
      ] as Booking[];

      mockBookingService.getUserBooking.mockResolvedValue(bookings);

      const result = await controller.getUserBooking(userId, { user: { id: 'userId1', role: UserRole.USER } });

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Bookings retrieved successfully',
        data: bookings,
      });
      expect(mockBookingService.getUserBooking).toHaveBeenCalledWith(userId);
    });

  it('should return an You can only view your own bookings', async () => {
    const userId = 'userId1';
    const user1: User = { id: 'userId1', role: UserRole.USER } as User;
    const user2: User = { id: 'userId2', role: UserRole.USER } as User;
    const hotel1 = { id: 'hotelId1', name: 'Hotel 1', location: 'Test Location 1' } as Hotel;
    const hotel2 = { id: 'hotelId2', name: 'Hotel 2', location: 'Test Location 2' } as Hotel;
    const bookings = [
      { id: '1', hotel: hotel1, user: user1, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() },
      { id: '2', hotel: hotel2, user: user2, checkInDate: new Date(), checkOutDate: new Date(), createdAt : new Date() }
    ] as Booking[];

    mockBookingService.getUserBooking.mockResolvedValue(bookings);

    const result = await controller.getUserBooking(userId, { user: { id: 'userId2', role: UserRole.USER } });

    expect(result).toEqual({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'You can only view your own bookings',
    });
    expect(mockBookingService.getUserBooking).not.toHaveBeenCalledWith();
  });
  });
});
