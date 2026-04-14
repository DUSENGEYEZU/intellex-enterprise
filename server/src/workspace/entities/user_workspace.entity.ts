
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_workspace', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class UserWorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public user_id: string;

  @Column()
  public workspace_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}
