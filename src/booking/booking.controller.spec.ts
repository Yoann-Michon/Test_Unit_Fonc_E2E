import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HotelService } from '../hotel/hotel.service'; // Import HotelService if required by BookingService

describe('BookingController', () => {
  let controller: BookingController;
  let bookingService: BookingService;

  const mockBookingRepository = {};
  const mockHotelService = {}; // Add a mock for HotelService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository, // Provide a mock for the BookingRepository
        },
        {
          provide: HotelService, // Mock HotelService if it's required in BookingService
          useValue: mockHotelService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    bookingService = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(bookingService).toBeDefined();
  });
});
