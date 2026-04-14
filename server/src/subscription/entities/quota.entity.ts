import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('monthly_quota', {
  orderBy: {
    month: 'DESC',
  },
})
export class MonthlyQuotaEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public month_start: string;

  @Column()
  public month_end: string;

  @Column()
  public max_limit: number;

  @Column({default: 0})
  public used: number;

  @Column({default: true})
  public is_active: boolean;

  @Column()
  public plan_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}