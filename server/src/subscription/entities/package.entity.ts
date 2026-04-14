import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('package', {
  orderBy: {
    amount: 'ASC',
  },
})
export class PackageEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public name: string;

  @Column({default: 'month'})
  public frequency: string;

  @Column({default: 0})
  public amount: number; 

  @Column({default: 'USD'})
  public currency: string;

  @Column({default: 0})
  public max_calls: number;

  @Column({type: 'decimal', precision: 10, scale: 2, default: 0})
  public extra_call_cost: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}