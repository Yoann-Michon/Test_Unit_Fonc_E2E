import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Hotel } from './entities/hotel.entity';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(Hotel) private hotelRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    try {
      const existingHotel = await this.hotelRepository.findOneBy({
        name: createHotelDto.name,
      });
      if (existingHotel) {
        throw new BadRequestException('Hotel already exists');
      }
      return await this.hotelRepository.save(createHotelDto);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating hotel: ${error.message}`,
      );
    }
  }

  async findAll(limit: number = 10, 
    sortBy: 'name' | 'location' | 'price' = 'name', // default sort by name
    order: 'ASC' | 'DESC' = 'DESC'): Promise<Hotel[]> {
      try {
        return this.hotelRepository.find({
      order: { [sortBy]: order },
      take: limit,
    });
      } catch (error) {
        throw new InternalServerErrorException('Error retrieving hotels');
      }
    }

    async searchHotel(query: string): Promise<Hotel[]> {
        try {
          return await this.hotelRepository.find({
            where: [{ name: ILike(`%${query}%`) }],
            take: 10,
          });
        } catch (error) {
          throw new InternalServerErrorException('Error searching for hotels');
        }
      }

  async findOne(id: string): Promise<Hotel> {
      try {
        const hotel = await this.hotelRepository.findOneBy({ id });
        if (!hotel) {
          throw new NotFoundException('hotel not found');
        }
        return hotel;
      } catch (error) {
        throw new InternalServerErrorException(`Error finding hotel: ${error.message}`);
      }
    }
  
    async update(id: string, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
      try {
        const hotel = await this.hotelRepository.findOneBy({ id });
  
        if (!hotel) {
          throw new NotFoundException('Hotel not found');
        }
  
        await this.hotelRepository.update(id, updateHotelDto);
  
        const updatedHotel = await this.hotelRepository.findOneBy({ id });
        if (!updatedHotel) {
          throw new NotFoundException('Error retrieving updated hotel');
        }
  
        return updatedHotel;
      } catch (error) {
        throw new InternalServerErrorException(`Error updating hotel: ${error.message}`);
      }
    }
    
    async remove(id: string): Promise<string> {
      try {
        const hotel = await this.hotelRepository.findOneBy({ id });
    
        if (!hotel) {
          throw new NotFoundException(`Hotel not found`);
        }
    
        await this.hotelRepository.delete({ id });
        return `Hotel with id ${id} deleted`;
      } catch (error) {
        throw new Error(`Error deleting hotel`);
      }
    }    
}
