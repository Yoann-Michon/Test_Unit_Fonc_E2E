import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserRole } from '../user/entities/user.enum';
import { Roles } from '../auth/guard/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Public } from 'src/auth/guard/public.decorator';

@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Public()
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    const booking = await this.bookingService.create(
      req.user,
      createBookingDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Request() req) {
    const booking = await this.bookingService.findAll(
      req.user,
      req.user.role === 'admin',
    );
    return {
      statusCode: HttpStatus.OK,
      message: booking.length
        ? 'Bookings retrieved successfully'
        : 'No bookings found',
      data: booking,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.USER)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.findOne(
      id,
      req.user,
      req.user.role === 'admin',
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Booking retrieved successfully',
      data: booking,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.USER)
@Patch(':id')
async update(
  @Request() req,
  @Param('id') bookingId: string,
  @Body() updateBookingDto: UpdateBookingDto
) {
  const updatedBooking = await this.bookingService.update(req.user, bookingId, updateBookingDto);
  return {
    statusCode: HttpStatus.OK,
    message: 'Booking updated successfully',
    data: updatedBooking,
  };
}


  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.bookingService.remove(
      id,
      req.user,
      req.user.role === 'admin',
    );
    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.USER)
  @Get('user/:id')
  async getUserBooking(@Param('id') id: string, @Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You can only view your own bookings',
      };
    }

    const bookings = await this.bookingService.getUserBooking(id);
    return {
      statusCode: HttpStatus.OK,
      message: bookings.length
        ? 'Bookings retrieved successfully'
        : 'No bookings found',
      data: bookings,
    };
  }
}
