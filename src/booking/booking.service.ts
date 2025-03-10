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
import { UserService } from 'src/user/user.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking) private bookingRepository: Repository<Booking>,
    private hotelService: HotelService,
    private userService: UserService
  ) {}

  async create(
    createBookingDto: CreateBookingDto, userId: string
  ): Promise<Booking> {
    try {
      
      const hotel = await this.hotelService.findOne(createBookingDto.hotelId);
      const user = await this.userService.findOneById(userId);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

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
  async update(user: User, bookingId: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    try {
      const booking = await this.bookingRepository.findOne({ where: { id: bookingId }, relations: ['user'] });
  
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }
  
      if (user.role !== UserRole.ADMIN && booking.user.id !== user.id) {
        throw new ForbiddenException("You don't have permission to update this booking");
      }
  
      return await this.bookingRepository.save({...booking, ...updateBookingDto});
    } catch (error) {
      throw new InternalServerErrorException(`Failed to update booking: ${error.message}`);
    }
  }
  

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

  async getUserBooking(userId: string): Promise<Booking[]> {
    try {
      const bookings = await this.bookingRepository.find({ where: { user: { id: userId } } });
  
      if (!bookings || bookings.length === 0) {
        throw new NotFoundException(`No bookings found for user with ID ${userId}`);
      }
  
      return bookings;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to fetch bookings: ${error.message}`);
    }
  }
  
  
  
}
