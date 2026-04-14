import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('payout_history', {
    orderBy: {created_at: 'DESC'}
})
export class PayoutHistoryEntity{
     @PrimaryGeneratedColumn('uuid')
      public id: string;
    
      @Column({nullable: true})
      public workspace_id: string;

      @Column({type:'decimal'})
      public amount: number;

      @Column({nullable: true})
      bank_name: string;
  
      @Column({nullable: true})
      bank_account_name: string;
  
       @Column({nullable: true})
      bank_account_number: string;
    
      @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
      public created_at: string;
}
