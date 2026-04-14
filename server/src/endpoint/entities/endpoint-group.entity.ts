import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('endpoint_group', {
    orderBy: {
        created_at: 'DESC',
    },
})
export class EndpointGroupEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public name: string;

    @Column()
    public description: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public updated_at: Date;

    @Column()
    public workspace_id: string;

    /** When true, group metadata and public endpoints are listed on the marketplace catalog URL */
    @Column({ type: 'boolean', default: false })
    public is_public: boolean;

    @Column({nullable: true})
    public created_by: string;
}