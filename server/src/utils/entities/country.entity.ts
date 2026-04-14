import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('country', {
  orderBy: {
    name: 'ASC',
  },
})
export class CountryEntity {
 @PrimaryGeneratedColumn('uuid')
  public id: string;
  
  @Column()
  public name: string;

  @Column({nullable: true})
  public code: string;

  @Column({nullable: true})
  public region_id: string;

  @Column({nullable: true})
  public longitude: string;

  @Column({nullable: true})
  public latitude: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}