import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('traffic', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class TrafficEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({nullable: true})
  public consumer_workspace_id: string;

  @Column()
  public producer_workspace_id: string;

  @Column()
  public service_id: string;

  @Column()
  public endpoint_id: string;

  @Column()
  public status: string;

  @Column({nullable: true})
  public remarks: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}