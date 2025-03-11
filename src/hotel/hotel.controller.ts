import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Query,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
} from '@nestjs/common';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Public } from '../auth/guard/public.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from '../auth/guard/roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserRole } from '../user/entities/user.enum';
import { FilesInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam,
  ApiQuery,
  ApiBearerAuth
} from '@nestjs/swagger';
import { Hotel } from './entities/hotel.entity';

@ApiTags('Hotels')
@Controller('hotel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ 
    summary: 'Create a new hotel',
    description: 'Create a new hotel with images (Admin only)'
  })
  @ApiBody({
    type: CreateHotelDto,
    examples: {
      hotel: {
        value: {
          name: 'Luxury Hotel',
          street: '123 Main Street',
          location: 'Paris, France',
          description: 'A beautiful luxury hotel in the heart of Paris',
          price: 299.99,
        },
        description: 'Example hotel creation payload'
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Hotel successfully created',
    schema: {
      example: {
        statusCode: 201,
        message: 'Hotel successfully created',
        data: {
          id: 'uuid-v4-format',
          name: 'Luxury Hotel',
          street: '123 Main Street',
          location: 'Paris, France',
          description: 'A beautiful luxury hotel in the heart of Paris',
          picture_list: ['https://example.com/image1.jpg'],
          price: 299.99
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data or missing images',
    schema: {
      example: {
        statusCode: 400,
        message: 'At least one image is required'
      }
    }
  })
  async create(
    @Body() createHotelDto: CreateHotelDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
  
    const hotel = await this.hotelService.create(createHotelDto, files); 
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Hotel successfully created',
      data: hotel,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ 
    summary: 'Get all hotels',
    description: 'Retrieve all hotels with optional filtering and sorting'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of hotels to return' })
  @ApiQuery({ 
    name: 'sortBy', 
    required: false, 
    enum: ['name', 'location', 'price'],
    description: 'Sort hotels by field' 
  })
  @ApiQuery({ 
    name: 'order', 
    required: false, 
    enum: ['ASC', 'DESC'],
    description: 'Sort order' 
  })
  @ApiResponse({
    status: 200,
    description: 'Hotels retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Hotels retrieved successfully',
        data: [{
          id: 'uuid-v4-format',
          name: 'Luxury Hotel',
          street: '123 Main Street',
          location: 'Paris, France',
          description: 'A beautiful luxury hotel in the heart of Paris',
          picture_list: ['https://example.com/image1.jpg'],
          price: 299.99
        }]
      }
    }
  })
  async findAll(
    @Query('limit') limit: number,
    @Query('sortBy') sortBy: 'name' | 'location' | 'price',
    @Query('order') order: 'ASC' | 'DESC',
  ) {
    const hotels = await this.hotelService.findAll(limit, sortBy, order);
    return {
      statusCode: HttpStatus.OK,
      message: hotels.length ? 'Hotels retrieved successfully' : 'No hotels found',
      data: hotels,
    };
  }

  @Public()
  @Get('search/:query')
  @ApiOperation({ 
    summary: 'Search hotels',
    description: 'Search hotels by name or location'
  })
  @ApiParam({
    name: 'query',
    required: true,
    description: 'Search query string',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      example: {
        statusCode: 200,
        message: 'Hotel found',
        data: [{
          id: 'uuid-v4-format',
          name: 'Luxury Hotel',
          street: '123 Main Street',
          location: 'Paris, France',
          description: 'A beautiful luxury hotel in the heart of Paris',
          picture_list: ['https://example.com/image1.jpg'],
          price: 299.99
        }]
      }
    }
  })
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
  @ApiOperation({ 
    summary: 'Get hotel by ID',
    description: 'Retrieve a specific hotel by its ID'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Hotel ID (UUID)',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Hotel found',
    schema: {
      example: {
        statusCode: 200,
        message: 'Hotel retrieved successfully',
        data: {
          id: 'uuid-v4-format',
          name: 'Luxury Hotel',
          street: '123 Main Street',
          location: 'Paris, France',
          description: 'A beautiful luxury hotel in the heart of Paris',
          picture_list: ['https://example.com/image1.jpg'],
          price: 299.99
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Hotel not found'
  })
  async findOne(@Param('id') id: string) {
    const hotel = await this.hotelService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hotel retrieved successfully',
      data: hotel,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiOperation({ 
    summary: 'Update hotel',
    description: 'Update a hotel\'s information (Admin only)'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Hotel ID (UUID)',
    type: String
  })
  @ApiBody({
    type: Hotel,
    examples: {
      hotel: {
        value: {
          name: 'Updated Luxury Hotel',
          price: 399.99,
        },
        description: 'Example hotel update payload'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Hotel updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Hotel updated successfully',
        data: {
          id: 'uuid-v4-format',
          name: 'Updated Luxury Hotel',
          street: '123 Main Street',
          location: 'Paris, France',
          description: 'A beautiful luxury hotel in the heart of Paris',
          picture_list: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          price: 399.99
        }
      }
    }
  })
  async update(
    @Param('id') id: string,
    @Body() updateHotelDto: UpdateHotelDto,
    @UploadedFiles() files: Express.Multer.File[]
  ) {    
    const updatedHotel = await this.hotelService.update(id, updateHotelDto, files); 
    return {
      statusCode: HttpStatus.OK,
      message: 'Hotel updated successfully',
      data: updatedHotel,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete hotel',
    description: 'Delete a hotel (Admin only)'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Hotel ID (UUID)',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'Hotel deleted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Hotel deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Hotel not found'
  })
  async remove(@Param('id') id: string) {
    await this.hotelService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Hotel deleted successfully',
    };
  }
}
