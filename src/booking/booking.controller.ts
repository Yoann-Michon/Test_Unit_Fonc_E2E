import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, HttpStatus } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserRole } from '../user/entities/user.enum';
import { Roles } from '../auth/guard/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.USER)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto,  @Request() req) {
    const booking = await this.bookingService.create(req.user, createBookingDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  @Get()
  async findAll(@Request() req) {
    const booking = await this.bookingService.findAll(req.user, req.user.role === 'admin');
    return {
      statusCode: HttpStatus.OK,
      message: booking.length ? 'Bookings retrieved successfully' : 'No bookings found',
      data: booking,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const booking = await this.bookingService.findOne(id, req.user, req.user.role === 'admin');
    return {
      statusCode: HttpStatus.OK,
      message: 'Booking retrieved successfully',
      data: booking,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto, @Request() req) {
    const updatedBooking = await this.bookingService.update(id, updateBookingDto, req.user, req.user.role === 'admin');
    return {
      statusCode: HttpStatus.OK,
      message: 'Booking updated successfully',
      data: updatedBooking,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.bookingService.remove(id, req.user, req.user.role === 'admin');
    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }
}
