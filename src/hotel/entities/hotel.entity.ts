import { Booking } from "../../booking/entities/booking.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column('text')
  description: string;

  @Column('simple-json')
  picture_list: string[];

  @Column("decimal")
  price: number;
  

  @OneToMany(() => Booking, (booking) => booking.hotel)
  bookings: Booking[];
}