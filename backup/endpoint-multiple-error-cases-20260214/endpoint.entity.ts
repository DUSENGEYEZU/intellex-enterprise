import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('endpoint', {
  orderBy: {
    created_at: 'DESC',
  },
})
@Index('IDX_is_public', ['is_public']) // Define index on the column
export class EndpointEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public summary: string;
  
  @Column()
  public description: string;
  
  @Column()
  public original_url: string;
  
  @Column()
  public path: string;
  
  @Column()
  public method: string;
  
  @Column({ nullable: true })
  public alias_url: string;
  
  @Column()
  public sample_request_object: string;
  
  @Column({nullable: true})
  public sample_response_object: string;

  @Column({nullable: true, default: '{}'})
  public sample_error_object: string;

  @Column()
  public service_id: string;

  @Column()
  public workspace_id: string;

  @Column({nullable: true})
  public target_industry: string;

  @Column({nullable: true})
  public target_region: string;

  @Column({nullable: true})
  public target_country: string;

  @Column({type: 'boolean', default: false, nullable: true})
  public is_public: boolean;

  @Column({type: 'boolean', default: false, nullable: true})
  public is_open: boolean;

  @Column({type: 'decimal', default: 0, nullable: true})
  public call_fee: number;

  @Column({default:1})
  public version: number;

  @Column({nullable: true})
  public created_by: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}