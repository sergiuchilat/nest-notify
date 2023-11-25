import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Notification} from '@/app/modules/notification/modules/internal/entities/notification.entity';

@Entity({
  name: 'notification_receivers',
})
export class NotificationReceiver {
    @PrimaryGeneratedColumn()
      id: number;
    
    @Column({
      type: 'int',
      nullable: false,
    })
      notification_id: number;

    @Column({
      length: 36,
      unique: true,
      nullable: false,
    })
      receiver_uuid: string;

    @Column({
      type: 'timestamp',
      nullable: true,
    })
      sent_at: Date;

    @Column({
      type: 'timestamp',
      nullable: true,
    })
      viewed_at: Date;

    @Column({
      type: 'timestamp',
      nullable: true,
    })
      confirm_view_at: Date;

    @ManyToOne(() => Notification, (notification) => notification.receivers)
    @JoinColumn({name: 'notification_id'})
      notification: Notification;


}
