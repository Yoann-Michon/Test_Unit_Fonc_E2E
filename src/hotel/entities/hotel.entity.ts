import { Booking } from "../../booking/entities/booking.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Hotel {
  @ApiProperty({
    description: 'Unique identifier of the hotel',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Hotel name',
    example: 'Luxury Palace Hotel'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Hotel street address',
    example: '123 Champs-Élysées Avenue'
  })
  @Column("text")
  street: string;

  @ApiProperty({
    description: 'Hotel location/city',
    example: 'Paris, France'
  })
  @Column()
  location: string;

  @ApiProperty({
    description: 'Detailed hotel description',
    example: 'A magnificent luxury hotel in the heart of Paris, offering stunning views of the Eiffel Tower.'
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'List of hotel image URLs',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    isArray: true
  })
  @Column('simple-array')
  picture_list: string[];

  @ApiProperty({
    description: 'Price per night',
    example: 299.99,
    type: 'number'
  })
  @Column("decimal")
  price: number;

  @ApiProperty({
    description: 'List of bookings for this hotel',
    type: () => Booking,
    isArray: true
  })
  @OneToMany(() => Booking, (booking) => booking.hotel)
  bookings: Booking[];
}