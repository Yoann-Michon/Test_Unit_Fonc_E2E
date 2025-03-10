import { Module } from '@nestjs/common';
import { UploadImgService } from './upload-img.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(), // Pour charger les variables d'environnement
  ],
  providers: [UploadImgService],
  exports: [UploadImgService],
})
export class UploadImgModule {}
