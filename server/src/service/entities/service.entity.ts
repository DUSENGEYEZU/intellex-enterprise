import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('service', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public name: string;

  @Column({nullable: true})
  public description: string;

  @Column()
  public workspace_id: string;

  @Column({default: false})
  public is_public: boolean;

  @Column({nullable: true})
  public created_by: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}
