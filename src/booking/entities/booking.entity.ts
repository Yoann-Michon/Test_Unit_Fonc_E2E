import { Hotel } from "../../hotel/entities/hotel.entity";
import { User } from "../../user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Booking {
    @ApiProperty({
        description: 'Unique identifier of the booking',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ApiProperty({
        description: 'Check-in date',
        example: '2025-03-11T12:00:00.000Z',
        type: Date
    })
    @Column('datetime')
    checkInDate: Date;
  
    @ApiProperty({
        description: 'Check-out date',
        example: '2025-03-15T12:00:00.000Z',
        type: Date
    })
    @Column('datetime')
    checkOutDate: Date;
  
    @ApiProperty({
        description: 'Booking creation date',
        example: '2025-03-10T14:30:00.000Z',
        type: Date
    })
    @CreateDateColumn()
    createdAt: Date;
    
    @ApiProperty({
        description: 'User who made the booking',
        type: () => User
    })
    @ManyToOne(() => User, (user) => user.bookings,{ onDelete: 'SET NULL' })
    user: User;
  
    @ApiProperty({
        description: 'Booked hotel',
        type: () => Hotel
    })
    @ManyToOne(() => Hotel, (hotel) => hotel.bookings,{ onDelete: 'SET NULL' })
    hotel: Hotel;
}
