import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { Express } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import '../../config/cloudinary.config';
import * as streamifier from 'streamifier';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private async uploadFileToCloudinary(
    file: Express.Multer.File,
  ): Promise<any> {
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: resourceType === 'video' ? 'video_uploads' : 'image_uploads',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async create(dto: CreateContentDto, file: Express.Multer.File) {
    try {
      const uploaded = await this.uploadFileToCloudinary(file);

      const parsedTags =
        typeof dto.tags === 'string'
          ? (dto.tags as string).split(',').map((tag) => tag.trim())
          : dto.tags;

      const data = {
        title: dto.title,
        // duration:
        //   typeof dto.duration === 'string'
        //     ? parseInt(dto.duration, 10)
        //     : dto.duration,
        description: dto.description,
        tags: parsedTags,
        moduleId: dto.moduleId,
        viewCount:
          typeof dto.viewCount === 'string'
            ? parseInt(dto.viewCount, 10)
            : (dto.viewCount ?? 0),
        url: uploaded.secure_url,
      };

      const content = await this.prisma.content.create({ data });

      // ✅ Notify all subscribed/paid users
      const paidUsers = await this.prisma.user.findMany({
        where: { isSubscribed: true },
        select: { id: true },
      });

      console.log(paidUsers);

      const notifications = paidUsers.map((user) =>
        this.notificationService.create({
          title: 'New Content Added',
          message: `New content "${content.title}" has been added.`,
          contentId: content.id,
        }),
      );

      await Promise.all(notifications);

      return content;
    } catch (error) {
      console.error('Cloudinary error:', error);
      throw new Error(
        'Video upload failed: ' + (error?.message || 'Unknown error'),
      );
    }
  }

  async incrementViewCount(id: string) {
    return this.prisma.content.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  findByModule(moduleId: string) {
    return this.prisma.content.findMany({
      where: { moduleId },
    });
  }

  async delete(id: string) {
    return this.prisma.content.delete({
      where: { id },
    });
  }
}
