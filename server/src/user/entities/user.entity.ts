import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users', {
  orderBy: {
    created_at: 'DESC',
  },
})
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ nullable: true })
  public first_name: string;

  @Column({ nullable: true })
  public last_name: string;

  @Column({ nullable: true, unique: true })
  public email: string;

  @Column({ nullable: true, unique: false })
  public phone: string;

  @Column({nullable: true})
  public password: string;

  @Column({ nullable: true })
  public created_by: string;

  @Column({ nullable: true })
  public role: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created_at: string;
}
