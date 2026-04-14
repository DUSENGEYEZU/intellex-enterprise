import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('invoice', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public title: string;

  @Column({type:'decimal', default: 0})
  public amount: number;

  @Column({default: false})
  public is_paid: boolean;

  @Column({default: "RWF"})
  public currency: string;

  @Column({default: "NEW"})
  public payment_status: string;

  @Column({nullable: true})
  public payment_method: string;

  @Column({nullable: true})
  public remarks: string;

  @Column({nullable: true})
  public external_id: string;

  @Column({nullable: true})
  public payment_reference: string;

  @Column()
  public workspace_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;

  @Column({ type: 'timestamp', nullable: true})
  public paid_at: string;
}