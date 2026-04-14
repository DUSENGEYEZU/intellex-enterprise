import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workspace', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ unique: true })
  public name: string;

  @Column({ nullable: true })
  public description: string;

  @Column({ nullable: true })
  public logo_url: string;

  @Column({ nullable: true })
  public website_url: string;

  @Column({ nullable: true })
  public industry_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}
