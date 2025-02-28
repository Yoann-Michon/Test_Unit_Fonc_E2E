import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking } from './entities/booking.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Hotel } from '../hotel/entities/hotel.entity';
import { Roles } from '../auth/guard/roles.decorator';
import { UserRole } from '../user/entities/user.enum';
import { Public } from '../auth/guard/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { HotelService } from 'src/hotel/hotel.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    private hotelService: HotelService,
  ) {}

  @Public()
  async create(
    user: User,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    try {
      const hotel = await this.hotelService.findOne(createBookingDto.hotelId);

      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }

      const booking = this.bookingRepository.create({
        user,
        hotel,
        checkInDate: createBookingDto.checkInDate,
        checkOutDate: createBookingDto.checkOutDate,
      });

      return this.bookingRepository.save(booking);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating booking: ${error.message}`,
      );
    }
  }

  @Roles(UserRole.ADMIN, UserRole.USER)
  async findAll(user: User, isAdmin: boolean = false): Promise<Booking[]> {
    try {
      if (isAdmin) {
        return this.bookingRepository.find({ relations: ['user', 'hotel'] });
      }

      return this.bookingRepository.find({
        where: { user: { id: user.id } },
        relations: ['hotel'],
      });
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving bookings');
    }
  }

  @Roles(UserRole.USER, UserRole.ADMIN)
  async findOne(
    id: string,
    user: User,
    isAdmin: boolean = false,
  ): Promise<Booking> {
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id },
        relations: ['user', 'hotel'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (!isAdmin && booking.user.id !== user.id) {
        throw new ForbiddenException(
          'You are not authorized to access this booking',
        );
      }

      return booking;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding booking: ${error.message}`,
      );
    }
  }
  @Roles(UserRole.USER, UserRole.ADMIN)
  async update(
    id: string,
    updatebookingDto: UpdateBookingDto,
    user: User,
    isAdmin: boolean = false,
  ): Promise<Booking> {
    try {
      const booking = await this.findOne(id, user, isAdmin);

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (!isAdmin && booking.user.id !== user.id) {
        throw new ForbiddenException(
          'You are not authorized to update this booking',
        );
      }

      await this.bookingRepository.update(id, updatebookingDto);

      return this.findOne(id, user, isAdmin);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating booking: ${error.message}`,
      );
    }
  }

  @Roles(UserRole.USER, UserRole.ADMIN)
  async remove(
    id: string,
    user: User,
    isAdmin: boolean = false,
  ): Promise<string> {
    try {
      const booking = await this.findOne(id, user, isAdmin);

      if (!booking) {
        throw new NotFoundException(`booking not found`);
      }

      if (!isAdmin && booking.user.id !== user.id) {
        throw new ForbiddenException(
          'You are not authorized to delete this booking',
        );
      }

      await this.bookingRepository.delete({ id });
      return `Booking with id ${id} deleted`;
    } catch (error) {
      throw new Error(`Error deleting booking`);
    }
  }
}
