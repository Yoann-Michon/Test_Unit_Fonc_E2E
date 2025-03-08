import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HotelService } from 'src/hotel/hotel.service';  // Assurez-vous que HotelService est importé correctement

describe('BookingService', () => {
  let service: BookingService;

  const mockHotelService = {
    findAll: jest.fn().mockResolvedValue([]), // Exemple de méthode mockée
    // Ajoutez d'autres méthodes du HotelService si nécessaire pour votre test
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useClass: Repository, // Mock du repository de Booking
        },
        {
          provide: HotelService, // Ici on utilise HotelService directement pour le mock
          useValue: mockHotelService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
