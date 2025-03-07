import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { HotelModule } from './hotel/hotel.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';


@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env',isGlobal: true  }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    UserModule,
    HotelModule,
    AuthModule,
    BookingModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'src/data/akkor.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
