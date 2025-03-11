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

  const mockRequest = (userRole: UserRole) => ({
    user: {
      id: '5',
      role: userRole,
      email: 'user@example.com',
    },
  });

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
    it('should create a new booking successfully', async () => {
      const createBookingDto: CreateBookingDto = {
        hotelId: '5',
        userId: '5',
        checkInDate: new Date('2025-03-11T12:00:00.000Z'),
        checkOutDate: new Date('2025-03-15T12:00:00.000Z'),
      };
  
      const mockCreatedBooking = {
        id: '5',
        ...createBookingDto,
        user: {
          id: '5',
          email: 'user@example.com',
        },
        hotel: {
          id: '5',
          name: 'Hotel Example',
        },
      };
  
      mockBookingService.create.mockResolvedValue(mockCreatedBooking);
  
      const result = await controller.create(createBookingDto, mockRequest(UserRole.USER));
  
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('Booking created successfully');
      expect(result.data).toEqual(mockCreatedBooking);
      expect(mockBookingService.create).toHaveBeenCalledWith(createBookingDto, '5');
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
    // it('should return Forbidden for unauthenticated users trying to update a booking', async () => {
    //   const updateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() };
    
    //   // Simulez l'appel à canActivate qui retourne false pour l'utilisateur non authentifié
    //   mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);
    
    //   // Testez que l'utilisateur non authentifié tente de modifier la réservation
    //   await expect(controller.update({}, '1', updateBookingDto))
    //     .rejects
    //     .toThrow(TypeError);
    // });
    // it('should return Forbidden for users trying to update another user\'s booking', async () => {
    //   const user2 = { id: 'user2', role: UserRole.USER }; // Utilisateur non autorisé
    //   const updateBookingDto = { checkInDate: new Date(), checkOutDate: new Date() }; // Exemples de données pour la mise à jour
    
    //   // Appel de la méthode de mise à jour avec un utilisateur non autorisé
    //   await expect(controller.update({ user: user2 }, '1', updateBookingDto))
    //     .rejects
    //     .toThrow(ForbiddenException); // Vérifie que l'exception ForbiddenException est bien lancée
    // });
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
