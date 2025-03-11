import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from './user.enum';
import { Booking } from '../../booking/entities/booking.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User\'s first name',
    example: 'John'
  })
  @Column()
  firstname: string;

  @ApiProperty({
    description: 'User\'s last name',
    example: 'Doe'
  })
  @Column()
  lastname: string;

  @ApiProperty({
    description: 'User\'s unique email address',
    example: 'john.doe@example.com'
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'User\'s nickname',
    example: 'johndoe'
  })
  @Column()
  pseudo: string;

  @ApiProperty({
    description: 'User\'s hashed password',
    example: 'hashedPassword123',
    writeOnly: true
  })
  @Column()
  @Exclude()
  password: string;

  @ApiProperty({
    description: 'User\'s role in the system',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER
  })
  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'List of user\'s bookings',
    type: () => Booking,
    isArray: true
  })
  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}
