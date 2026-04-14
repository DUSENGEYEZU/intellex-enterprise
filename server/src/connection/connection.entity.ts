import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ConnectionStatuses } from './connection.dto';

@Entity('connection', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class ConnectionEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({nullable: true})
  public service_id: string;

  @Column({nullable: true})
  public endpoint_id: string;

  @Column({nullable: true})
  public endpoint_group_id: string;

  @Column()
  public consumer_workspace_id: string;

  @Column()
  public producer_workspace_id: string;

  @Column({nullable: true})
  public api_key: string;

  @Column({default: ConnectionStatuses.NEW})
  public status: string;

  @Column({nullable: true})
  public purpose: string;

  @Column({nullable: true})
  public created_by: string;

  @Column({nullable: true})
  public granted_by: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;

  @Column({ type: 'timestamp', nullable: true})
  public granted_at: string;
}