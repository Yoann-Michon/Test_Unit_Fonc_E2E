import { Test, TestingModule } from '@nestjs/testing';
import { HotelController } from './hotel.controller';
import { HotelService } from './hotel.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';

describe('HotelController', () => {
  let controller: HotelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelController],
      providers: [
        HotelService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: {}, // Tu peux ici fournir un faux repository ou un mock adapté
        },
      ],
    }).compile();

    controller = module.get<HotelController>(HotelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
