import { ApiProperty } from "@nestjs/swagger";

export class CreatePackageDto{
    @ApiProperty()
    name: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    currency: string;

    @ApiProperty()
    max_calls: number;

    @ApiProperty()
    extra_call_cost: number;
}

export class PaymentInitDto{
    @ApiProperty()
    amount: number;

    @ApiProperty()
    workspace_id: string;
}

export class PaymentCallbackDto{
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    data: {
        amount: number,
        transactionId: string; 
        paymentStatus: string;
        paymentReference: string; 
        paymentMethod: string; 
        paidAt: string;
    }; 
}

export class CreatePayoutAccountDto{
    @ApiProperty()
    workspace_id: string;
    @ApiProperty()
    bank_name: string;
    @ApiProperty()
    bank_account_name: string;
    @ApiProperty()
    bank_account_number: string;
    @ApiProperty()
    swift_code: string;
    @ApiProperty()
    country: string;
}