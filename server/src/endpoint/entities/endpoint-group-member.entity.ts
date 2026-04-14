import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('endpoint_group_members', {
    orderBy: {
        created_at: 'DESC',
    },
})

export class EndpointGroupMemberEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public group_id: string;

    @Column()
    public endpoint_id: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public created_at: Date;

    @Column()
    public created_by: string;
}