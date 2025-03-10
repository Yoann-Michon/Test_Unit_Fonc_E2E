import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        Number(process.env.SALT),
      );

      return await this.usersRepository.save({
        ...createUserDto,
        password: hashedPassword,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creating user: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.usersRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving users');
    }
  }

  async searchUser(query: string): Promise<User[]> {
    try {
      return await this.usersRepository.find({
        where: [
          { email: ILike(`%${query}%`) },
          { lastname: ILike(`%${query}%`) },
          { firstname: ILike(`%${query}%`) },
        ]
      });
    } catch (error) {
      throw new InternalServerErrorException('Error searching for users');
    }
  }

  async findOne(email: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({ where: { email } });

      return user || null;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user: ${error.message}`,
      );
    }
  }
  
  async findOneById(id: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });

      return user || null;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error finding user: ${error.message}`,
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.usersRepository.findOneBy({ id });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const updatedUser = { ...user, ...updateUserDto };
      
      return await this.usersRepository.save(updatedUser);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error updating user: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<string> {
    try {
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.usersRepository.delete({ id });
      return `User with id ${id} deleted`;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error deleting user: ${error.message}`,
      );
    }
  }
}
