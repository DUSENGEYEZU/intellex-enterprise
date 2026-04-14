import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('payout_account')
export class PayoutAccountEntity{
     @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    workspace_id: string;

    @Column({nullable: true})
    bank_name: string;

    @Column({nullable: true})
    bank_account_name: string;

     @Column({nullable: true})
    bank_account_number: string;

     @Column({nullable: true})
    swift_code: string;

     @Column({nullable: true})
    country: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: string;
}