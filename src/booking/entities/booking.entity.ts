import { Hotel } from "src/hotel/entities/hotel.entity";
import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Booking {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('datetime')
    checkInDate: Date;
  
    @Column('datetime')
    checkOutDate: Date;
  
    @CreateDateColumn()
    createdAt: Date;
    
    @ManyToOne(() => User, (user) => user.bookings)
    user: User;
  
    @ManyToOne(() => Hotel, (hotel) => hotel.bookings)
    hotel: Hotel;
  }
