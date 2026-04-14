import { Module } from '@nestjs/common';
import { TrafficController } from './traffic.controller';
import { EndpointModule } from 'src/endpoint/endpoint.module';
import { HttpModule } from '@nestjs/axios';
import { ConnectionModule } from 'src/connection/connection.module';
import { ConnectionService } from 'src/connection/connection.service';
import { UtilsModule } from 'src/utils/utils.module';
import { ConnectionEntity } from 'src/connection/connection.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrafficService } from './traffic.service';
import { TrafficEntity } from './traffic.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { EndpointEntity } from 'src/endpoint/entities/endpoint.entity';
import { UserWorkspaceEntity } from 'src/workspace/entities/user_workspace.entity';
import { EndpointGroupEntity } from 'src/endpoint/entities/endpoint-group.entity';
import { SubscriptionModule } from 'src/subscription/subscription.module';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { PackageEntity } from 'src/subscription/entities/package.entity';
import { SubscriptionPlanEntity } from 'src/subscription/entities/subscription_plan.entity';
import { InvoiceEntity } from 'src/subscription/entities/invoice.entity';
import { WorkspaceWalletEntity } from 'src/subscription/entities/workspace-wallet.entity';
import { TransactionEntity } from 'src/subscription/entities/transaction.entity';
import { PayoutAccountEntity } from 'src/subscription/entities/payout-account.entity';
import { PayoutHistoryEntity } from 'src/subscription/entities/payout-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectionEntity, TrafficEntity, UserEntity, EndpointEntity, UserWorkspaceEntity, EndpointGroupEntity, PackageEntity, SubscriptionPlanEntity, InvoiceEntity, WorkspaceWalletEntity, TransactionEntity, PayoutAccountEntity, PayoutHistoryEntity]), //Needed to provide ConnectionEntity repo into the traffic context
    UtilsModule,
    EndpointModule,
    HttpModule,
    ConnectionModule,
    SubscriptionModule
  ],
  controllers: [TrafficController],
  providers: [ConnectionService, TrafficService, SubscriptionService]
})
export class TrafficModule {}