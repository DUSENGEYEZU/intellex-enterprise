import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PackageEntity } from './entities/package.entity';
import { SubscriptionPlanEntity } from './entities/subscription_plan.entity';
import { InvoiceEntity } from './entities/invoice.entity';
import { WorkspaceWalletEntity } from './entities/workspace-wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PayoutAccountEntity } from './entities/payout-account.entity';
import { PayoutHistoryEntity } from './entities/payout-history.entity';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(PackageEntity) private packageEntity: Repository<PackageEntity>,
        @InjectRepository(SubscriptionPlanEntity) private planEntity: Repository<SubscriptionPlanEntity>,
        @InjectRepository(InvoiceEntity) private invoiceEntity: Repository<InvoiceEntity>,
        @InjectRepository(WorkspaceWalletEntity) private walletEntity: Repository<WorkspaceWalletEntity>,
        @InjectRepository(TransactionEntity) private transactionEntity: Repository<TransactionEntity>,
        @InjectRepository(PayoutAccountEntity) private payoutAccountEntity: Repository<PayoutAccountEntity>,
        @InjectRepository(PayoutHistoryEntity) private payoutHistoryEntity: Repository<PayoutHistoryEntity>,
    ){}

    /** PAYMENT PROCESSES */
    // Create invoice
    async createInvoice(amount: number, workspace_id: string){
        const invoice = this.invoiceEntity.create({
            amount: amount, 
            title:'Intellex Account Topup', 
            workspace_id: workspace_id,
        });
        return await this.invoiceEntity.save(invoice);
    }
    
    // Update invoice with provider reference ids
    async updateInvoice(invoice_id: string, external_id: string){
        const invoice = await this.invoiceEntity.findOneBy({id: invoice_id});
        if(invoice){
            invoice.external_id = external_id;
            this.invoiceEntity.save(invoice);
            return await {status: true, message:"Invoice updated successfully", data: invoice}
        }else{
            return await {status: false, message:"Internal invoice not found"}
        }
    }

    // Callback to update invoice from payment provider
    async processIremboPaymentCallback(transactionId, paymentStatus, paymentReference, paymentMethod, paidAt){
        const invoice = await this.invoiceEntity.findOneBy({id: transactionId})
        // Make sure the invoice is not already marked as paid
        if(invoice){
            if(invoice.is_paid === true){
                return {status: false, message:"The invoice is already paid"}
            }else{
                invoice.is_paid = paymentStatus === "PAID" ? true : false;
                invoice.payment_status = paymentStatus;
                invoice.payment_reference = paymentReference;
                invoice.payment_method = paymentMethod
                invoice.paid_at = new Date(paidAt+':00').toISOString();
                this.invoiceEntity.save(invoice);
                return await {status: true, message:"Invoice updated successfully", data: invoice}
            }
        }else{
            return {status: false, message:"Invoice not found"}
        }
    }

    // Find last 5 invoices by workspace_id
    async findInvoicesByWorkspaceId(workspace_id: string, limit: number = 5) {
        const invoices = await this.invoiceEntity.find({
            where: { workspace_id: workspace_id },
            order: { created_at: 'DESC' },
            take: limit,
        });
        return { status: true, message: "Success", data: invoices };
    }

    /** PAYMENT PROCESSES */

    /** WALLET MANAGEMENT */
    async createWallet(workspace_id: string){
        const wallet = await this.walletEntity.save(this.walletEntity.create({workspace_id: workspace_id}));
        return {status: true, message:"Success", data: wallet};
    }

    async getWalletByWorkspaceId(workspace_id: string){
        const wallet = await this.walletEntity.findOneBy({workspace_id: workspace_id});
        if(wallet){
            return {status: true, message:"Found", data: wallet}
        }else{
            return {status: false, message:"Wallet not found"}
        }
    }

    // Increment waller
    async creditWallet(workspace_id: string, credit_amount: number){
        const wallet = await this.walletEntity.findOneBy({workspace_id: workspace_id});
        if(wallet){
            console.log("\n Balance before: "+wallet.balance)
            wallet.balance = Math.floor(wallet.balance) + Math.floor(credit_amount);
            console.log(`\n Balance after adding ${credit_amount}: ${wallet.balance}`,`\n\n`)
            await this.walletEntity.save(wallet);
            return {status: true, message:"Wallet credited successfully"}
        }else{
            return {status: false, message:"Wallet not found"}
        }
    }

    // Decrement wallet
    async debitWallet(workspace_id: string, debit_amount: number){
        const wallet = await this.walletEntity.findOneBy({workspace_id: workspace_id});
        if(wallet){
            // Makesure there is enough balance
            if(wallet.balance < debit_amount){
                return {status: false, message:"Not enough balance on the wallet"}
            }else{
                console.log("\n Balance before: "+wallet.balance)
                wallet.balance = wallet.balance - Math.floor(debit_amount)
                console.log(`\n Balance after debiting ${debit_amount}: ${wallet.balance}`,`\n\n`)
                await this.walletEntity.save(wallet);
                return {status: true, message:"Wallet debited successfully"}
            }
        }else{
            return {status: false, message:"Wallet not found"}
        }
    }

    async createTransaction(workspace_id: string, amount: number, type: 'DEBIT' | 'CREDIT'){
        if(type === 'CREDIT' || type === 'DEBIT'){
            const created = this.transactionEntity.create({workspace_id: workspace_id, amount: amount, type: type})
            const trans = await this.transactionEntity.save(created);
            return await {status: true, message:"Transaction created successfully", data: trans}
        }else{
            return {status: false, message:"Unknown transaction type"}
        }
    }

    async getTransactions(workspace_id: string, start_date: string, end_date: string){
        const transactions = await this.transactionEntity.find({
            where: {
                workspace_id: workspace_id,
                created_at: Between(start_date+' 00:00', end_date+' 23:59')
            }
        });
        return { status: true, message: "Success", data: transactions };
    }

    // Create or update
    async createOrUpdatePayoutAccount(
        workspace_id: string,
        bank_name: string,
        bank_account_name: string,
        bank_account_number: string,
        swift_code: string,
        country: string
    ){
        const account_exists = await this.payoutAccountEntity.findOneBy({workspace_id: workspace_id});
        if(account_exists){
            // Update instead
            account_exists.bank_name = bank_name;
            account_exists.bank_account_name = bank_account_name;
            account_exists.bank_account_number = bank_account_number;
            account_exists.swift_code = swift_code;
            account_exists.country = country;
            const saved = await this.payoutAccountEntity.save(account_exists);
            return {status: true, message:"Success", data: saved}
        }else{
            // Create a new account
            const account = this.payoutAccountEntity.create({
                workspace_id: workspace_id,
                bank_name: bank_name,
                bank_account_name: bank_account_name,
                bank_account_number: bank_account_number,
                swift_code: swift_code,
                country: country
            });
            const saved = await this.payoutAccountEntity.save(account);
            return {status: true, message:"Payout account created successfully", data: saved}
        }
    }

    async findPayoutAccountByWorkspaceId(workspace_id: string){
        const account = await this.payoutAccountEntity.findOneBy({workspace_id: workspace_id});
        return {status: true, message:"Success", data: account};
    }

    async createPayoutRecord(
        workspace_id: string,
        amount: number,
        bank_name: string,
        bank_account_name: string,
        bank_account_number: string
    ){
        const payout = this.payoutHistoryEntity.save(this.payoutHistoryEntity.create({
            workspace_id: workspace_id,
            amount: amount,
            bank_name: bank_name,
            bank_account_name: bank_account_name,
            bank_account_number: bank_account_number,
        }));
        return await {status: true, message:"Success", data: payout};
    }

    async getRecentPayoutHistoryByWorksppaceId(workspace_id: string, limit:number = 10){
        const payouts = await this.payoutHistoryEntity.find({
            where: { workspace_id: workspace_id },
            order: { created_at: 'DESC' },
            take: limit,
        });
        return await {status: true, message:"Success", data: payouts};
    }

    /** WALLET MANAGEMENT */

    // Package
    async createPackage(name: string, amount: number, currency: string, max_calls: number, extra_call_cost: number){
        const subsPackage = await this.packageEntity.save(this.packageEntity.create({
            name: name,
            amount: amount,
            currency: currency,
            max_calls: max_calls,
            extra_call_cost: extra_call_cost
        }))
        return {status: true, message:"Success", data: subsPackage}
    }

    async findAllPackages(){
        const packages = await this.packageEntity.find();
        return {status: true, message:"Success", data: packages}
    }

    async findPackageById(package_id: string){
        try{
            const _package = await this.packageEntity.findOneBy({id: package_id});
            if(_package && _package.id) return {status: true, message:"Success", data: _package}
        }catch(e){
            return {status: false, message: e.toString()}
        }
    }

    async findPackageByName(package_name: string){
        const _package = await this.packageEntity.findOneBy({name: package_name});
        if(_package && _package.id) return {status: true, message:"Success", data: _package}
        else return {status: false, message:"Not found", data: _package}
    }

    async deletePackageById(package_id){
        return await this.packageEntity.delete({id: package_id})
    }

    // Plan
    async createSubscriptionPlan(workspace_id: string, package_id: string){
        const plan = await this.planEntity.save(this.planEntity.create({
            workspace_id: workspace_id,
            package_id: package_id,
            renewal_day: new Date().getDate()
        }))
        return {status: true, message:"Success", data: plan}
    }

    async findActivePlanByWorkspaceId(workspace_id: string){
        const plan = await this.planEntity
    .createQueryBuilder('subscription_plan')
    .leftJoin('package', 'package', 'subscription_plan.package_id::uuid = package.id')  // Manual join
    .addSelect('package.max_calls')  // Select the max_calls from PackageEntity
    .addSelect('package.name')  // Select the name from PackageEntity
    .where('subscription_plan.workspace_id = :workspace_id', { workspace_id })
    .andWhere('subscription_plan.is_canceled = false')
    .getRawOne();

        return {status: true, message:"Success", data: plan}
    }

    async cancelPlan(plan_id: string){
        const plan = await this.planEntity.findOneBy({id: plan_id});
        plan.is_canceled = true;
        plan.canceled_at = new Date().toDateString();
        await this.planEntity.save(plan);
        return {status: true, message:"Success", data: plan}
    }

    // HELPERS
    getOneMonthFromNow() {
        // Get the current date
        const today = new Date();
        
        // Set the date to one month ahead
        today.setMonth(today.getMonth() + 1);
        
        // Get the year, month, and day
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');  // Month is 0-indexed
        const day = today.getDate().toString().padStart(2, '0');
        
        // Return the formatted date as YYYY-MM-DD
        return `${year}-${month}-${day}`;
    }

    getTodayDate(){
        // Get the current date
        const today = new Date();
        
        // Get the year, month, and day
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');  // Month is 0-indexed
        const day = today.getDate().toString().padStart(2, '0');
        
        // Return the formatted date as YYYY-MM-DD
        return `${year}-${month}-${day}`;
    }
    
}
