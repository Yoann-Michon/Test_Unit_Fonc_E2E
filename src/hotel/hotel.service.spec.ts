import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';  

describe('HotelService', () => {
  let service: HotelService;

  // Créez un mock du repository
  const mockHotelRepository = {
    // Vous pouvez ajouter des méthodes mock ici si nécessaire
    find: jest.fn().mockResolvedValue([]),  // Exemple de méthode mockée
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        {
          provide: getRepositoryToken(Hotel),  // Fournir le mock du repository
          useValue: mockHotelRepository,  // Fournir la valeur mockée
        },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
