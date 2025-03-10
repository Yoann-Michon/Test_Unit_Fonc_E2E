import { Module } from '@nestjs/common';
import { UploadImgService } from './upload-img.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
  ],
  providers: [UploadImgService],
  exports: [UploadImgService],
})
export class UploadImgModule {}
