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
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { UserRole } from '../user/entities/user.enum';
import { Roles } from '../auth/guard/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Booking } from './entities/booking.entity';

@ApiTags('Bookings')
@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Post()
  @ApiOperation({ 
    summary: 'Create a new booking',
    description: 'Creates a new booking with the specified hotel and dates'
  })
  @ApiBody({
    type: Booking,
    examples: {
      booking: {
        value: {
          hotelId: 'uuid-v4-format',
          checkInDate: '2025-03-11T12:00:00.000Z',
          checkOutDate: '2025-03-15T12:00:00.000Z'
        },
        description: 'Example booking creation payload'
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Booking successfully created',
    schema: {
      example: {
        statusCode: 201,
        message: 'Booking created successfully',
        data: {
          id: 'uuid-v4-format',
          checkInDate: '2025-03-11T12:00:00.000Z',
          checkOutDate: '2025-03-15T12:00:00.000Z',
          createdAt: '2025-03-10T14:30:00.000Z',
          user: {
            id: 'uuid-v4-format',
            email: 'user@example.com'
          },
          hotel: {
            id: 'uuid-v4-format',
            name: 'Hotel Example'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data provided',
    schema: {
      example: {
        statusCode: 400,
        message: ['hotelId must be a valid UUID', 'checkInDate must be a valid date']
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Hotel or User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Hotel not found'
      }
    }
  })
  async create(@Body() createBookingDto: Partial<CreateBookingDto>, @Request() req) {
    
    const booking = await this.bookingService.create(
      createBookingDto,req.user.id
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ 
    summary: 'Get all bookings',
    description: 'Retrieve all bookings (Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all bookings',
    schema: {
      example: {
        statusCode: 200,
        message: 'Bookings retrieved successfully',
        data: [{
          id: 'uuid-v4-format',
          checkInDate: '2025-03-11T12:00:00.000Z',
          checkOutDate: '2025-03-15T12:00:00.000Z',
          createdAt: '2025-03-10T14:30:00.000Z',
          user: {
            id: 'uuid-v4-format',
            email: 'user@example.com'
          },
          hotel: {
            id: 'uuid-v4-format',
            name: 'Hotel Example'
          }
        }]
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden'
      }
    }
  })
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

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get booking by ID',
    description: 'Retrieve a specific booking by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (UUID)',
    type: 'string',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Booking details retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Booking retrieved successfully',
        data: {
          id: 'uuid-v4-format',
          checkInDate: '2025-03-11T12:00:00.000Z',
          checkOutDate: '2025-03-15T12:00:00.000Z',
          createdAt: '2025-03-10T14:30:00.000Z',
          user: {
            id: 'uuid-v4-format',
            email: 'user@example.com'
          },
          hotel: {
            id: 'uuid-v4-format',
            name: 'Hotel Example'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found'
  })
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

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update booking',
    description: 'Update an existing booking'
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (UUID)',
    type: 'string',
    required: true
  })
  @ApiBody({
    type: UpdateBookingDto,
    examples: {
      booking: {
        value: {
          checkInDate: '2025-03-12T12:00:00.000Z',
          checkOutDate: '2025-03-16T12:00:00.000Z'
        },
        description: 'Example booking update payload'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Booking updated successfully',
        data: {
          id: 'uuid-v4-format',
          checkInDate: '2025-03-12T12:00:00.000Z',
          checkOutDate: '2025-03-16T12:00:00.000Z',
          createdAt: '2025-03-10T14:30:00.000Z',
          user: {
            id: 'uuid-v4-format',
            email: 'user@example.com'
          },
          hotel: {
            id: 'uuid-v4-format',
            name: 'Hotel Example'
          }
        }
      }
    }
  })
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

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete booking',
    description: 'Delete a booking (Admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (UUID)',
    type: 'string',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Booking deleted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Booking deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found'
  })
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.bookingService.remove(
      id,
      req.user,
      req.user.role === UserRole.ADMIN,
    );
    return {
      statusCode: HttpStatus.OK,
      message: result,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Get('user/:id')
  @ApiOperation({ 
    summary: 'Get user bookings',
    description: 'Retrieve all bookings for a specific user'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    type: 'string',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Bookings retrieved successfully',
        data: [{
          id: 'uuid-v4-format',
          checkInDate: '2025-03-11T12:00:00.000Z',
          checkOutDate: '2025-03-15T12:00:00.000Z',
          createdAt: '2025-03-10T14:30:00.000Z',
          hotel: {
            id: 'uuid-v4-format',
            name: 'Hotel Example'
          }
        }]
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Cannot access other user\'s bookings',
    schema: {
      example: {
        statusCode: 403,
        message: 'You can only view your own bookings'
      }
    }
  })
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
