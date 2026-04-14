import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('transaction', {
    orderBy: {
      created_at: 'DESC',
    },
  })
export class TransactionEntity{
    @PrimaryGeneratedColumn('uuid')
      public id: string;
    
      @Column({type: 'decimal', default:0})
      public amount: number;

      @Column()
      public type: string; // CREDIT or DEBIT

      @Column()
      public workspace_id: string;
    
      @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
      public created_at: string;
}