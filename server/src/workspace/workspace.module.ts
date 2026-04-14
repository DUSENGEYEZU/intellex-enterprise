
import { Module } from '@nestjs/common';
import { WorkspaceController } from './controllers/workspace/workspace.controller';
import { WorkspaceService } from './services/workspace/workspace.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from 'src/utils/utils.module';
import { WorkspaceEntity } from './entities/workspace.entity';
import { UserWorkspaceEntity } from './entities/user_workspace.entity';
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
    imports: [TypeOrmModule.forFeature([
      WorkspaceEntity, 
      UserWorkspaceEntity, 
      PackageEntity, 
      SubscriptionPlanEntity,
      InvoiceEntity,
      WorkspaceWalletEntity,
      TransactionEntity,
      PayoutAccountEntity,
      PayoutHistoryEntity
    ]), 
    UtilsModule, 
    SubscriptionModule],
    controllers: [WorkspaceController],
    providers: [WorkspaceService, SubscriptionService],
    exports: [WorkspaceService],
  })
  export class WorkspaceModule {}
  