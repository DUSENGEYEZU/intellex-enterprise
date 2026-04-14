import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from 'src/utils/utils.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PackageEntity } from './entities/package.entity';
import { SubscriptionPlanEntity } from './entities/subscription_plan.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { WorkspaceWalletEntity } from './entities/workspace-wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PayoutAccountEntity } from './entities/payout-account.entity';
import { PayoutHistoryEntity } from './entities/payout-history.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PackageEntity, SubscriptionPlanEntity, InvoiceEntity, WorkspaceWalletEntity, TransactionEntity, PayoutAccountEntity, PayoutHistoryEntity]),
        UtilsModule
      ],
      controllers: [SubscriptionController],
      providers: [SubscriptionService]
})
export class SubscriptionModule {}
