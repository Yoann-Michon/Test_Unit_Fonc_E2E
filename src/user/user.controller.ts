import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseGuards, NotFoundException, Request, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Public } from 'src/auth/guard/public.decorator';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/guard/roles.decorator';
import { UserRole } from './entities/user.enum';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User successfully created',
      data: user,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: users.length ? 'Users retrieved successfully' : 'No users found',
      data: users,
    };
  }

  @Roles(UserRole.ADMIN)
  @Get('search/:query')
  async search(@Param('query') query: string) {
    const users = await this.userService.searchUser(query);
    return {
      statusCode: HttpStatus.OK,
      message: users.length ? 'Users found' : 'No users match your search',
      data: users,
    };
  }

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
  @Roles(UserRole.ADMIN,UserRole.USER)
  @Get(':id')
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

  @Roles(UserRole.ADMIN, UserRole.USER)
  @Patch(':id')
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


  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: `User with id ${id} deleted successfully`,
    };
  }
}
