import { Module } from '@nestjs/common';
import { NotificationInternalController } from './notification-internal.controller';
import { NotificationInternalService } from './notification-internal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {Notification} from '@/app/modules/notification/modules/internal/entities/notification.entity';
import {NotificationContent} from '@/app/modules/notification/modules/internal/entities/notification-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationContent])],
  exports: [TypeOrmModule, NotificationInternalService],
  controllers: [NotificationInternalController],
  providers: [
    NotificationInternalService
  ],
})
export class NotificationInternalModule {}