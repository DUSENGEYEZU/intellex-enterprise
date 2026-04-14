import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription_plan', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public workspace_id: string;

  @Column()
  public package_id: string;

  @Column({default: false})
  public is_canceled: boolean;

  @Column()
  public renewal_day: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;

  @Column({nullable: true})
  public canceled_at: string;
}