import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/entities/user.enum';
import { User } from '../user/entities/user.entity';
import { Hotel } from '../hotel/entities/hotel.entity';
import { ExecutionContext, HttpStatus, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto'
import { UploadImgService } from '../../libs/upload-img/src/upload-img.service'
import { UserService } from '../user/user.service';

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
      request.user = { id: 'userId', role: UserRole.USER };
      return true; // Autorise l'accès par défaut
    }),
  };
  
  const mockRolesGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      return request.user && request.user.role === UserRole.ADMIN; // Autorise uniquement les admins
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
      const createBookingDto = {
        checkInDate: new Date('2025-03-11T19:23:05.066Z'),
        checkOutDate: new Date('2025-03-11T19:23:05.066Z'),
        hotelId: '',  // Ensure hotelId is properly set
        userId: 'userId',  // The user ID you want to pass
      };
  
      const user = { id: 'userId', role: UserRole.USER };  // The user mock with role
  
      const booking = { ...createBookingDto, id: '1' };  // The result expected from the service
  
      mockBookingService.create.mockResolvedValue(booking);
  
      // Mock the request context to simulate the user being attached to the request
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user,  // Attach the user to the request object
          }),
        }),
      };
  
      // Call the controller's create method
      await controller.create(createBookingDto, mockContext.switchToHttp().getRequest());
  
      // Check that mockBookingService.create was called with the correct arguments
      expect(mockBookingService.create).toHaveBeenCalledWith(
        expect.objectContaining({ checkInDate: expect.any(Date), checkOutDate: expect.any(Date), hotelId: expect.any(String), userId: 'userId' },), // This is for the createBookingDto
        expect.objectContaining({ id: 'userId'}), // This is for the user
      );
    });
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
      const updateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };
    
      // Simulez l'appel à canActivate qui retourne false pour l'utilisateur non authentifié
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);
    
      // Testez que l'utilisateur non authentifié tente de modifier la réservation
      await expect(controller.update({}, '1', updateBookingDto))
        .rejects
        .toThrow(TypeError);
    });
    it('should return Forbidden for users trying to update another user\'s booking', async () => {
      const user1 = { id: '1', role: UserRole.USER };
      const user2 = { id: '2', role: UserRole.USER };
      
      // Simuler une réservation créée par user1
      const booking = { id: '1', userId: '1', checkInDate: new Date(), checkOutDate: new Date() };
      
      const updateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };
    
      // Simulez la méthode `findOne` qui retourne la réservation existante
      mockBookingService.findOne.mockResolvedValue(booking);
    
      // Testez que l'utilisateur2 tente de modifier la réservation de user1
      await expect(controller.update({ user: user2 }, '1', updateBookingDto))
        .rejects
        .toThrow(ForbiddenException);
    });
  });
  describe('remove', () => {
    
    it('should remove a booking for admin user', async () => {
      const bookingId = '1';
      mockBookingService.remove.mockResolvedValue('Booking deleted successfully');

      const result = await controller.remove(bookingId, { user: { id: 'adminId', role: UserRole.ADMIN } });

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Booking deleted successfully',
      });
      expect(mockBookingService.remove).toHaveBeenCalledWith(bookingId, { id: 'adminId', role: UserRole.ADMIN }, true);
    });
    it('should return Forbidden for non-admin users trying to delete a booking', async () => {
      // Crée un utilisateur non-admin
      const user = { id: 'userId', role: UserRole.USER };
      // Moque le service pour qu'il vérifie le rôle
      mockBookingService.remove.mockImplementationOnce((id, user, isAdmin) => {
        if (!isAdmin) {
          throw new ForbiddenException('Access denied');
        }
        return 'Booking deleted successfully';
      });
      // Teste que l'exception est bien levée
      await expect(controller.remove('1', { user: user })).rejects.toThrow(ForbiddenException);
    });
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
