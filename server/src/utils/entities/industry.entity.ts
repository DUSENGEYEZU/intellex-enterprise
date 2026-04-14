import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('industry', {
  orderBy: {
    name: 'ASC',
  },
})
export class IndustryEntity {
  @PrimaryColumn()
  public id: string;

  @Column()
  public name: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}