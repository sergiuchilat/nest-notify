import {Injectable, NotFoundException,} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, IsNull, Repository} from 'typeorm';
import {InternalNotification} from './entities/internal-notification.entity';
import {InternalNotificationCreatePayloadDto} from './dto/internal-notification-create-payload.dto';
import {plainToInstance} from 'class-transformer';
import {v4 as uuidv4} from 'uuid';
import {IPaginationOptions, paginateRaw} from 'nestjs-typeorm-paginate';
import {
  InternalNotificationCreateResponseDto
} from '@/app/modules/notification/modules/internal/dto/internal-notification-create-response.dto';
import {InternalNotificationTranslation} from '@/app/modules/notification/modules/internal/entities/internal-notification-translation.entity';
import {InternalNotificationReceiver} from '@/app/modules/notification/modules/internal/entities/internal-notification-receiver.entity';
import {Language} from '@/app/enum/language.enum';
import {
  NotificationGetOneResponseDto
} from '@/app/modules/notification/modules/internal/dto/notification-get-one-response.dto';
import {EventsGateway} from '@/app/services/events-gateway/events.gateway';

@Injectable()
export class InternalNotificationService {
  constructor(
    @InjectRepository(InternalNotification)
    private readonly notificationRepository: Repository<InternalNotification>,
    @InjectRepository(InternalNotificationReceiver)
    private readonly notificationReceiverRepository: Repository<InternalNotificationReceiver>,
    private readonly dateSource: DataSource,
    private readonly eventsGateway: EventsGateway
  ) {}

  async create(
    notification: InternalNotificationCreatePayloadDto
  ): Promise<InternalNotificationCreateResponseDto> {
    const notificationEntity = plainToInstance(InternalNotification, notification);
    notificationEntity.uuid = uuidv4();
    const queryRunner = this.dateSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let addedNotification: InternalNotificationCreateResponseDto = null;

    try {
      addedNotification = await queryRunner.manager.save(InternalNotification, notificationEntity);

      for (const notificationTranslation of notificationEntity.translations) {
        notificationTranslation.notification_id = notificationEntity.id;
        await queryRunner.manager.save(InternalNotificationTranslation, notificationTranslation);
      }

      for (const notificationReceiver of notification.receivers) {
        const messageReceiverEntity: InternalNotificationReceiver = {
          id: null,
          notification_id: notificationEntity.id,
          receiver_uuid: notificationReceiver,
          notification: null,
          sent_at: new Date(),
          viewed_at: null,
          confirm_view_at: null
        };

        this.emitEventNotificationCreated({
          receiver: notificationReceiver,
          uuid: notificationEntity.uuid,
          translations: notificationEntity.translations.map(translation => {
            return {
              language: translation.language,
              subject: translation.subject
            };
          }),
        });

        await queryRunner.manager.save(InternalNotificationReceiver, messageReceiverEntity);
      }

      await queryRunner.commitTransaction();

    } catch (e) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    for (const notificationReceiver of notification.receivers){
      await this.emitEventUnreadCounter(notificationReceiver);
    }

    return plainToInstance(InternalNotificationCreateResponseDto ,addedNotification);
  }

  async getAllPaginated(
    options: IPaginationOptions
  ): Promise<any> {

    try {
      const [items, count] = await this.notificationRepository.findAndCount({
        relations: ['content', 'receivers'],
        skip: (Number(options.page) -1) * Number(options.limit),
        take: Number(options.limit),
        order: {
          created_at: 'DESC'
        },
      });

      return {
        items: items,
        meta: {
          itemCount: items.length,
          itemsPerPage: options.limit,
          totalItems: count,
          currentPage: options.page,
          totalPages: Math.ceil(count / Number(options.limit)),
        }
      };
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async getOne(uuid: string): Promise<any> {
    try {
      return await this.notificationRepository.findOneOrFail({
        where: {
          uuid: uuid
        },
        relations: ['content', 'receivers'],

      });
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async getAllPaginatedByReceiver(
    receiver_uuid: string,
    language: Language,
    options: IPaginationOptions
  ): Promise<any> {

    try {
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notifications')
        .select(['notifications.uuid AS uuid', 'notifications.sender_uuid AS sender_uuid'])
        .innerJoin(
          InternalNotificationReceiver,
          'receiver',
          'receiver.notification_id = notifications.id AND receiver.receiver_uuid = :receiver_uuid',
          {receiver_uuid: receiver_uuid}
        )
        .addSelect('receiver.sent_at', 'sent_at')
        .addSelect('receiver.viewed_at', 'viewed_at')
        .innerJoin(
          InternalNotificationTranslation,
          'content',
          'content.notification_id = notifications.id AND content.language = :language ',
          {language: this.setLanguage(language)}
        )
        .addSelect('content.subject', 'subject')
        // .addSelect('content.body', 'body')
        .skip((Number(options.page) - 1) * Number(options.limit))
        .orderBy('receiver.sent_at', 'DESC')
        .take(Number(options.limit))
      ;

      return await paginateRaw(queryBuilder, options);
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async getUnreadPaginatedByReceiver(
    receiver_uuid: string,
    language: Language,
    options: IPaginationOptions
  ): Promise<any> {

    try {
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notifications')
        .select(['notifications.uuid AS uuid', 'notifications.sender_uuid AS sender_uuid'])
        .innerJoin(
          InternalNotificationReceiver,
          'receiver',
          'receiver.notification_id = notifications.id AND receiver.receiver_uuid = :receiver_uuid AND receiver.viewed_at IS NULL',
          {receiver_uuid: receiver_uuid}
        )
        .addSelect('receiver.sent_at', 'sent_at')
        //.addSelect('receiver.viewed_at', 'viewed_at')
        .innerJoin(
          InternalNotificationTranslation,
          'content',
          'content.notification_id = notifications.id AND content.language = :language ',
          {language: this.setLanguage(language)}
        )
        .addSelect('content.subject', 'subject')
        // .addSelect('content.body', 'body')
        .skip((Number(options.page) - 1) * Number(options.limit))
        .orderBy('receiver.sent_at', 'DESC')
        .take(Number(options.limit))
      ;

      return await paginateRaw(queryBuilder, options);
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async getOneByReceiver(receiver_uuid: string, notification_uuid: string, language: Language,): Promise<NotificationGetOneResponseDto> {
    try {
      const notification = await this.notificationRepository
        .createQueryBuilder('notifications')
        .select('notifications.uuid', 'uuid')
        .innerJoin(
          InternalNotificationTranslation,
          'content',
          'content.notification_id = notifications.id AND content.language = :language',
          {language: this.setLanguage(language)}
        )
        .addSelect('content.notification_id', 'notification_id')
        .addSelect('content.subject', 'subject')
        .addSelect('content.body', 'body')
        .innerJoin(
          InternalNotificationReceiver,
          'receiver',
          'receiver.notification_id = notifications.id AND receiver.receiver_uuid = :receiver_uuid',
          {receiver_uuid: receiver_uuid}
        )
        .addSelect('receiver.sent_at', 'sent_at')
        .addSelect('receiver.viewed_at', 'viewed_at')
        .where('notifications.uuid = :notification_uuid', { notification_uuid })
        .getRawOne()
      ;

      console.log(notification);

      const notificationReceiver = await this.notificationReceiverRepository.findOne(
        {
          where: {
            notification_id: notification.notification_id,
            receiver_uuid: receiver_uuid
          }
        }
      );
      if(notificationReceiver!==null && notificationReceiver.viewed_at === null){
        notificationReceiver.viewed_at = new Date();
        await this.notificationReceiverRepository.save(notificationReceiver);
      }

      await this.emitEventUnreadCounter(receiver_uuid);
      console.log('I AM HERE');

      return plainToInstance(NotificationGetOneResponseDto, notification);
    } catch (e) {
      console.log(e);
      throw new NotFoundException();
    }
  }

  async confirmReadByReceiver(receiver_uuid: string, notification_uuid: string): Promise<NotificationGetOneResponseDto> {
    try {
      const notificationId = await this.notificationRepository.findOneOrFail(
        {  where: { uuid: notification_uuid } }
      ).then(notification => notification.id);

      const notificationReceiver = await this.notificationReceiverRepository.findOneOrFail(
        {
          where: {
            notification_id: notificationId,
            receiver_uuid: receiver_uuid,
            confirm_view_at: IsNull()
          }
        }
      );

      notificationReceiver.confirm_view_at = new Date();
      await this.notificationReceiverRepository.save(notificationReceiver);
      return plainToInstance(NotificationGetOneResponseDto, notificationReceiver);

    } catch (e) {
      console.log(e);
      throw new NotFoundException();
    }
  }

  async getUnreadCountByReceiver(receiver_uuid: string): Promise<any> {
    try {
      const count = await this.notificationReceiverRepository.count({
        where: {
          receiver_uuid: receiver_uuid,
          viewed_at: IsNull()
        }
      });

      const lastNotification = await this.notificationReceiverRepository.findOne({
        where: {
          receiver_uuid: receiver_uuid,
        },
        order: {
          id: 'DESC'
        }
      });

      return {
        count: count,
        last_notification_sent: lastNotification.sent_at
      };
    } catch (e) {
      throw new NotFoundException();
    }
  }

  async delete(uuid: string): Promise<void> {
    try {
      await this.notificationRepository.findOneOrFail({
        where: [{ uuid }],
      });
      await this.notificationRepository.delete({
        uuid,
      });
    } catch (e) {
      throw new NotFoundException();
    }
  }

  private setLanguage(language: Language): string {
    if(language === Language.EN) {
      return 'EN';
    }
    if(language === Language.RO) {
      return 'RO';
    }
    if(language === Language.RU) {
      return 'RU';
    }
    return 'EN';
  }

  private async emitEventUnreadCounter(receiver_uuid: string) {
    const response = await this.getUnreadCountByReceiver(receiver_uuid);
    this.eventsGateway.server.emit('notification.internal.unread-count', {
      receiver: receiver_uuid,
      count: response.count
    });
  }

  private emitEventNotificationCreated(notification: any) {
    this.eventsGateway.server.emit('notification.internal.created', notification);
  }

  async truncate() {
    await this.notificationRepository.query('TRUNCATE TABLE messages CASCADE;');
  }

}
