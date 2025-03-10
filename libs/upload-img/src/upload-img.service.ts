import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as FormData from 'form-data';
import fetch from 'node-fetch';

@Injectable()
export class UploadImgService {
  async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
    try {
      console.log('🔹 Fichiers reçus:', files.map(f => f.originalname));
      
      if (!files || files.length === 0) {
        console.log('❌ Aucun fichier reçu');
        throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
      }
  
      const uploadedUrls: string[] = [];
  
      for (const file of files) {
        console.log(`📂 Traitement du fichier: ${file.originalname}, Taille: ${file.size} bytes`);
        
        const formData = new FormData();
        formData.append('image', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
  
        console.log('🔄 Envoi à ImgBB...');
        
        const response = await fetch(`${process.env.IMGBB_URL}?key=${process.env.IMGBB_KEY}`, {
          method: 'POST',
          body: formData,
          headers: {
            ...formData.getHeaders()
          }
        });
  
        const data = await response.json();
        console.log('📥 Réponse de ImgBB:', data);
  
        if (!response.ok || !data.success) {
          console.log('❌ Échec de l\'upload:', data.error?.message);
          throw new HttpException(
            data.error?.message || 'Failed to upload image to ImgBB',
            response.status || HttpStatus.BAD_REQUEST
          );
        }
  
        uploadedUrls.push(data.data.url);
        console.log(`✅ Upload réussi: ${data.data.url}`);
      }
  
      console.log('🎉 Toutes les images ont été uploadées:', uploadedUrls);
      return uploadedUrls;
  
    } catch (error) {
      console.error('🔥 Erreur d\'upload:', error);
      throw new HttpException(
        error.message || 'Error uploading images',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
}
