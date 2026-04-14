import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('endpoint_params', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class EndpointParamsEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public kind: string; //QUERY | PATH

  @Column()
  public key: string; //also 'key'

  @Column({nullable: true})
  public value: string;

  @Column({nullable: true, default: false})
  public is_required: boolean;

  @Column()
  public endpoint_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}