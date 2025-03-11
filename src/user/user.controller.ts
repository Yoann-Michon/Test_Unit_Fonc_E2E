import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseGuards,
  HttpStatus,
  NotFoundException,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Public } from 'src/auth/guard/public.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/guard/roles.decorator';
import { UserRole } from './entities/user.enum';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  [x: string]: any;
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user (Admin only)'
  })
  @ApiBody({
    type: User,
    examples: {
      user: {
        value: {
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          pseudo: 'johndoe',
          password: 'password123',
          role: 'user'
        },
        description: 'Example user creation payload'
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      example: {
        statusCode: 201,
        message: 'User created successfully',
        data: {
          id: 'uuid-v4-format',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          pseudo: 'johndoe',
          role: 'user'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - User already exists',
    schema: {
      example: {
        statusCode: 400,
        message: 'User already exists'
      }
    }
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User successfully created',
      data: user,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve all users (Admin only)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      example: {
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: [{
          id: 'uuid-v4-format',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          pseudo: 'johndoe',
          role: 'user'
        }]
      }
    }
  })
  async findAll() {
    const users = await this.userService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: users.length ? 'Users retrieved successfully' : 'No users found',
      data: users,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Get('search/:query')
  @ApiOperation({ 
    summary: 'Search users',
    description: 'Search users by email, firstname, or lastname'
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
        message: 'Users found',
        data: [{
          id: 'uuid-v4-format',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          pseudo: 'johndoe',
          role: 'user'
        }]
      }
    }
  })
  async search(@Param('query') query: string) {
    const users = await this.userService.searchUser(query);
    return {
      statusCode: HttpStatus.OK,
      message: users.length ? 'Users found' : 'No users match your search',
      data: users,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN,UserRole.USER)
  @Get(':email')
  async findOne(@Param('email') email: string, @Request() req) {
    if (req.user.email !== email && req.user.role !== UserRole.EMPLOYEE && req.user.role !== UserRole.ADMIN) {
      throw new NotFoundException(`You cannot view this user`);
    }
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN,UserRole.USER)
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by ID'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID (UUID)',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    schema: {
      example: {
        statusCode: 200,
        message: 'User retrieved successfully',
        data: {
          id: 'uuid-v4-format',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john.doe@example.com',
          pseudo: 'johndoe',
          role: 'user'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async findOneById(@Param('id') id: string, @Request() req) {
    if (req.user.id !== id && req.user.role !== UserRole.EMPLOYEE && req.user.role !== UserRole.ADMIN) {
      throw new NotFoundException(`You cannot view this user`);
    }
    const user = await this.userService.findOneById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Update user information (Admin only)'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID (UUID)',
    type: String
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      user: {
        value: {
          firstname: 'John Updated',
          lastname: 'Doe Updated',
          role: 'admin'
        },
        description: 'Example user update payload'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'User updated successfully',
        data: {
          id: 'uuid-v4-format',
          firstname: 'John Updated',
          lastname: 'Doe Updated',
          email: 'john.doe@example.com',
          pseudo: 'johndoe',
          role: 'admin'
        }
      }
    }
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {

    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException('You can only update your own information.');
    }

    if (updateUserDto.role && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can change user roles.');
    }

    if (updateUserDto.role && req.user.role !== UserRole.ADMIN && req.user.id === id) {
      throw new ForbiddenException('You cannot change your own role.');
    }
    try {
      const updatedUser = await this.userService.update(id, updateUserDto);

      return {
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @ApiBearerAuth('Authorization')
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete user',
    description: 'Delete a user (Admin only)'
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'User ID (UUID)',
    type: String
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'User deleted successfully'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: `User with id ${id} deleted successfully`,
    };
  }
}
