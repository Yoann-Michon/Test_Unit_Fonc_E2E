import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseGuards } from '@nestjs/common';
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

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return {
      statusCode: HttpStatus.OK,
      message: users.length ? 'Users retrieved successfully' : 'No users found',
      data: users,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get('search/:query')
  async search(@Param('query') query: string) {
    const users = await this.userService.searchUser(query);
    return {
      statusCode: HttpStatus.OK,
      message: users.length ? 'Users found' : 'No users match your search',
      data: users,
    };
  }
  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userService.update(id, updateUserDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  @Roles(UserRole.ADMIN, UserRole.EMPLOYEE)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: `User deleted successfully`,
    };
  }
}
