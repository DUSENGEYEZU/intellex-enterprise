import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('region', {
  orderBy: {
    name: 'ASC',
  },
})
export class RegionEntity {
  @PrimaryColumn()
  public id: string;

  @Column()
  public name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}