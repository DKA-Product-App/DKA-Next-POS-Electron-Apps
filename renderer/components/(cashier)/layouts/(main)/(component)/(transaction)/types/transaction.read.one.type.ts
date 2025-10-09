export type MoneyRaw = number;
export type MoneyPretty = string;

export const BILL_STATUS = {
    PAID: "PAID",
    UNPAID: "UNPAID",
    PENDING: "PENDING",
} as const;

export type BillStatus = (typeof BILL_STATUS)[keyof typeof BILL_STATUS];

export interface CountPriceGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    count: number;
    price: TMoney;
}

export interface BillItemsGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    activeCount: number;
    subtotalActive: TMoney;
}

export interface BillSummaryGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    billNo: string;
    items: BillItemsGeneric<TMoney>;
    tax: TMoney;
    grandTotalActive: TMoney;
    status: BillStatus;
    due: TMoney;
}

export interface TxBillsItemsGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    allCount: number;
    activeCount: number;
    inactiveCount: number;
    subtotalAll: TMoney;
    subtotalActive: TMoney;
}

export interface TxBillsSectionGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    count: number;
    items: TxBillsItemsGeneric<TMoney>;
    taxTotalOnActive: TMoney;
    grandTotalActive: TMoney;
    byBill: BillSummaryGeneric<TMoney>[];
}

export interface PaymentsSectionGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    paidBillsCount: number;
    pendingBillsCount: number;
    unpaidBillsCount: number;
    unpaidAmountTotal: TMoney;
}

export interface TxSummaryGeneric<TMoney extends MoneyRaw | MoneyPretty> {
    batches: { count: number };
    batchItems: {
        all: CountPriceGeneric<TMoney>;
        active: CountPriceGeneric<TMoney>;
        voidApproved: CountPriceGeneric<TMoney>;
        voidPending: CountPriceGeneric<TMoney>;
    };
    bills: TxBillsSectionGeneric<TMoney>;
    payments: PaymentsSectionGeneric<TMoney>;
}

// ===== Spesifik untuk raw vs pretty =====
export type TxSummaryRaw = TxSummaryGeneric<MoneyRaw>;
export type TxSummaryPretty = TxSummaryGeneric<MoneyPretty>;

// ===== Tipe return summarizeTx =====
export interface SummarizeTxReturn {
    raw: TxSummaryRaw;
    pretty: TxSummaryPretty;
}

