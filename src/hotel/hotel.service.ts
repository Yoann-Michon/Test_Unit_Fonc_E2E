import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UploadImgService } from '../../libs/upload-img/src/upload-img.service';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Hotel } from './entities/hotel.entity';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(Hotel) private hotelRepository: Repository<Hotel>,
    private readonly imgBBService: UploadImgService,
  ) {}

  async create(createHotelDto: CreateHotelDto, files: Express.Multer.File[]): Promise<Hotel> {
    try {

      const existingHotel = await this.hotelRepository.findOneBy({ name: createHotelDto.name });
      if (existingHotel) {
        throw new BadRequestException('Hotel with this name already exists');
      }

      if (!files || files.length === 0) {
        throw new BadRequestException('At least one image is required');
      }


      const imageUrls = await this.imgBBService.uploadImages(files);

      if (!imageUrls || imageUrls.length === 0) {
        throw new BadRequestException('Failed to upload images');
      }

      createHotelDto.picture_list = imageUrls;

      const hotel = this.hotelRepository.create(createHotelDto);
      const savedHotel = await this.hotelRepository.save(hotel);

      return savedHotel;
    } catch (error) {
      console.error('🔥 Erreur lors de la création de l’hôtel:', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(`Error creating hotel: ${error.message}`);
    }
  }

  async findAll(
    limit: number = 10,
    sortBy: 'name' | 'location' | 'price' = 'name',
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<Hotel[]> {
    try {
      return this.hotelRepository.find({
        order: { [sortBy]: order },
        take: limit,
      });
    } catch (error) {
      console.error('🔥 Erreur lors de la récupération des hôtels:', error);
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
      console.error('🔥 Erreur lors de la recherche:', error);
      throw new InternalServerErrorException('Error searching for hotels');
    }
  }

  async findOne(id: string): Promise<Hotel> {
    try {
      const hotel = await this.hotelRepository.findOneBy({ id });
      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }
      return hotel;
    } catch (error) {
      console.error('🔥 Erreur lors de la recherche de l’hôtel:', error);
      throw new InternalServerErrorException(`Error finding hotel: ${error.message}`);
    }
  }

  async update(id: string, updateHotelDto: UpdateHotelDto, files?: Express.Multer.File[]): Promise<Hotel> {
    try {
      const hotel = await this.hotelRepository.findOneBy({ id });

      if (!hotel) {
        throw new NotFoundException(`Hotel with ID ${id} not found`);
      }

      if (files && files.length > 0) {
        
        const existingImages = hotel.picture_list || [];
        const newImageUrls = await this.imgBBService.uploadImages(files);

        updateHotelDto.picture_list = [...existingImages, ...newImageUrls];

      }

      const updatedHotel = await this.hotelRepository.save({
        ...hotel,
        ...updateHotelDto,
      });

      return updatedHotel;
    } catch (error) {
      console.error('🔥 Erreur lors de la mise à jour:', error);
      if (error instanceof HttpException) throw error;
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
      throw new InternalServerErrorException(`Error deleting hotel: ${error.message}`);
    }
  }
}
