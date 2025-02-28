import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseGuards, Query } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Public } from 'src/auth/guard/public.decorator';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Roles } from 'src/auth/guard/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { UserRole } from 'src/user/entities/user.enum';

@Controller('hotel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() createHotelDto: CreateHotelDto) {
    const hotel = await this.hotelService.create(createHotelDto);
        return {
          statusCode: HttpStatus.CREATED,
          message: 'Hotel successfully created',
          data: hotel,
        };
  }

  @Public()
  @Get()
  async findAll(@Query('limit') limit: number,
  @Query('sortBy') sortBy: 'name' | 'location',
  @Query('order') order: 'ASC' | 'DESC',) {
    const hotels = await this.hotelService.findAll(limit, sortBy, order);
    return {
      statusCode: HttpStatus.OK,
      message: hotels.length ? 'Hotels retrieved successfully' : 'No hotels found',
      data: hotels,
    };
  }

  @Public()
  @Get('search/:query')
  async search(@Param('query') query: string) {
    const hotels = await this.hotelService.searchHotel(query);
    return {
      statusCode: HttpStatus.OK,
      message: hotels.length ? 'Hotel found' : 'No hotels match your search',
      data: hotels,
    };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const hotel = await this.hotelService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hotel retrieved successfully',
      data: hotel,
    }
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateHotelDto: UpdateHotelDto) {
    const updateHotel= await this.hotelService.update(id, updateHotelDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hotel updated successfully',
      data: updateHotel,
    }
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.hotelService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hotel deleted successfully',
    }
  }
}
