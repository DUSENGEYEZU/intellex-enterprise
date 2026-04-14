import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('workspace_wallet')
export class WorkspaceWalletEntity{
    @PrimaryGeneratedColumn('uuid')
      public id: string;
    
      @Column({unique: true})
      public workspace_id: string;

      @Column({type:'decimal', default:0})
      public balance: number;
    
      @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
      public created_at: string;
}