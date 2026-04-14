import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreatePackageDto, CreatePayoutAccountDto, PaymentCallbackDto, PaymentInitDto } from './subscription.dto';
import { Public } from 'src/authentication/guards/metadata/metadata';
import { UtilsService } from 'src/utils/services/utils.service';

@ApiTags("Subscription")
@Controller('subscription')
export class SubscriptionController {
    constructor(
        private subscriptionService: SubscriptionService,
        private utils: UtilsService
    ){}

    // Initiate Payment
    @Post('/paymnent/init')
    async initiatePayment(@Body() body: PaymentInitDto){
        console.log("Incoming payment request", body)
        // Create invoice
        const invoice = await this.subscriptionService.createInvoice(body.amount, body.workspace_id);
        console.log("Internal invoice created", invoice)
        if(invoice){
            // Create invoice at IremboPay (payment provider)
            const transactionPayload = {
                transactionId: invoice.id,
                paymentAccountIdentifier: process.env.IREMBO_PAYMENT_ACCOUNT_ID,
                paymentItems: [
                  {
                    unitAmount: body.amount,
                    quantity: 1,
                    code: process.env.IREMBO_PRODUCT_CODE
                  }
                ],
                description: "Intellex Wallet Top Up",
                language: "EN"
            }
            const headers = {
                "irembopay-secretkey":process.env.IREMBO_SECRET_KEY,
                "X-API-Version":"2"
            }
            console.log("Creating Irembo Invoice", transactionPayload)
            const response = await this.utils.initiateIremboPayment(process.env.IREMBO_PAYMENT_URL, transactionPayload, headers);
            console.log("Irembo invoice response ", response)
            if(response.success === true){
                // Update invoice details.
                const updated_invoice = await this.subscriptionService.updateInvoice(response.data.transactionId, response.data.invoiceNumber)
                console.log("Internal invoice updated", updated_invoice);
                return {status: true, message: response.message, data: {invoice_number: updated_invoice.data.external_id}};
            }else{
                console.log("Internal invoice was not updated")
                return {status: false, message: response.message};
            }
        }else{
            return {status: false, message: "Could not create invoice. Please try again"}
        }
    }

    // Process payment callback and increment customer wallet
    @Public()
    @Post('/payment/callback/irembo')
    async processPaymentCallback(@Body() body: PaymentCallbackDto){
        console.log("\n********************* \nIncoming callback from Irembo", body)
        console.log("Updating internal invoice...")
        const invoice =  await this.subscriptionService.processIremboPaymentCallback(body.data.transactionId, body.data.paymentStatus, body.data.paymentReference, body.data.paymentMethod, body.data.paidAt);
        console.log(invoice)
        // Credit customer wallet.
        if(invoice.status === true){
            if(invoice.data.is_paid === true){
                console.log("Crediting customer wallet...")
                this.subscriptionService.creditWallet(invoice.data.workspace_id, invoice.data.amount);
            }
        }
        // Send response back to the payment provider
        return {status: true, message:"Received"};
    }

    // Get workspace wallet
    @Get('/wallet/workspace/:workspace_id')
    async getWallet(@Param('workspace_id') workspace_id: string){
        return await this.subscriptionService.getWalletByWorkspaceId(workspace_id);
    }

    // Find last 5 invoices by workspace_id
    @Get('/invoices/workspace/:workspace_id')
    async findInvoicesByWorkspaceId(
        @Param('workspace_id') workspace_id: string,
        @Query('limit') limit : number
    ) {
        return await this.subscriptionService.findInvoicesByWorkspaceId(workspace_id, limit);
    }

    // Transactions
    @Get('/transactions/workspace/:workspace_id/dates/:start_date/:end_date')
    async getTransactions(
        @Param('workspace_id') workspace_id: string,
        @Param('start_date') start_date: string,
        @Param('end_date') end_date: string
    ){
        return await this.subscriptionService.getTransactions(workspace_id, start_date, end_date);
    }

    // Payout Accounts
    // Create a payout account
    @Post('/payout/account/createorupdate')
    async createPayoutAccount(@Body() body: CreatePayoutAccountDto) {
        return await this.subscriptionService.createOrUpdatePayoutAccount(body.workspace_id, body.bank_name, body.bank_account_name, body.bank_account_number, body.swift_code, body.country);
    }

    // Get payout account by workspace_id
    @Get('/payout/account/workspace/:workspace_id')
    async getPayoutAccountByWorkspaceId(@Param('workspace_id') workspace_id: string) {
        return await this.subscriptionService.findPayoutAccountByWorkspaceId(workspace_id);
    }

    // Get recent payout history for workspace
    @Get('/payout/history/workspace/:workspace_id: string')
    async getRecentPayoutHistoryByWorksppaceId(
        @Param('workspace_id') workspace_id: string,
        @Query('limit') limit : number
    ){
        return await this.subscriptionService.getRecentPayoutHistoryByWorksppaceId(workspace_id, limit);
    }

    // Pakage APIs
    // @Public()
    @Post('/package/create')
    async createSubscriptionPackage(@Body() body: CreatePackageDto){
        return await this.subscriptionService.createPackage(body.name, body.amount, body.currency, body.max_calls, body.extra_call_cost)
    }

    @Public()
    @Get('/package/all')
    async findAllSubscriptionPackages(){
        return await this.subscriptionService.findAllPackages();
    }

    @Public()
    @Get('/package/verify/id/:package_id')
    async findSubscriptionPackageById(@Param('package_id') package_id: string){
        return await this.subscriptionService.findPackageById(package_id);
    }

    @Public()
    @Get('/package/verify/name/:package_name')
    async findSubscriptionPackageByName(@Param('package_name') package_name: string){
        return await this.subscriptionService.findPackageByName(package_name);
    }

    // Plan APIs
    @Get('/plan/workspace/:workspace_id')
    async findActivePlanByWorkspaceId(@Param('workspace_id') workspace_id: string){
        return this.subscriptionService.findActivePlanByWorkspaceId(workspace_id);
    }

}
