export interface ReceiptData {
  masked_card: string;
  card_bin: string;
  amount: string | number;
  payment_id: number;
  currency: string;
  order_status: string;
  tran_type: string;
  sender_cell_phone: string;
  sender_account: string;
  card_type: string;
  rrn: string;
  approval_code: string;
  response_code: string;
  product_id: string;
  rectoken: string;
  rectoken_lifetime?: string;
  reversal_amount: number;
  settlement_amount: number;
  settlement_currency: string;
  settlement_date?: string;
  eci: number;
  fee: number;
  actual_amount: number;
  actual_currency: string;
  payment_system: string;
  verification_status: string;
  signature: string;
  email: string;
}

export class Receipt {
  public readonly maskedCard: string;
  public readonly cardBin: string;
  public readonly amount: number;
  public readonly paymentId: number;
  public readonly currency: string;
  public readonly status: string;
  public readonly transactionType: string;
  public readonly senderCellPhone: string;
  public readonly senderAccount: string;
  public readonly cardType: string;
  public readonly rrn: string;
  public readonly approvalCode: string;
  public readonly responseCode: string;
  public readonly productId: string;
  public readonly recToken: string;
  public readonly recTokenLifeTime?: Date;
  public readonly reversalAmount: number;
  public readonly settlementAmount: number;
  public readonly settlementCurrency: string;
  public readonly settlementDate?: Date;
  public readonly eci: number;
  public readonly fee: number;
  public readonly actualAmount: number;
  public readonly actualCurrency: string;
  public readonly paymentSystem: string;
  public readonly verificationStatus: string;
  public readonly signature: string;
  public readonly email: string;
  public readonly responseUrl?: string;

  private readonly rawData: ReceiptData;

  constructor(
    maskedCard: string,
    cardBin: string,
    amount: number,
    paymentId: number,
    currency: string,
    status: string,
    transactionType: string,
    senderCellPhone: string,
    senderAccount: string,
    cardType: string,
    rrn: string,
    approvalCode: string,
    responseCode: string,
    productId: string,
    recToken: string,
    recTokenLifeTime?: Date,
    reversalAmount: number = 0,
    settlementAmount: number = 0,
    settlementCurrency: string = '',
    settlementDate?: Date,
    eci: number = 0,
    fee: number = 0,
    actualAmount: number = 0,
    actualCurrency: string = '',
    paymentSystem: string = '',
    verificationStatus: string = '',
    signature: string = '',
    email: string = '',
    responseUrl?: string,
    rawData?: ReceiptData,
  ) {
    this.maskedCard = maskedCard;
    this.cardBin = cardBin;
    this.amount = amount;
    this.paymentId = paymentId;
    this.currency = currency;
    this.status = status;
    this.transactionType = transactionType;
    this.senderCellPhone = senderCellPhone;
    this.senderAccount = senderAccount;
    this.cardType = cardType;
    this.rrn = rrn;
    this.approvalCode = approvalCode;
    this.responseCode = responseCode;
    this.productId = productId;
    this.recToken = recToken;
    this.recTokenLifeTime = recTokenLifeTime;
    this.reversalAmount = reversalAmount;
    this.settlementAmount = settlementAmount;
    this.settlementCurrency = settlementCurrency;
    this.settlementDate = settlementDate;
    this.eci = eci;
    this.fee = fee;
    this.actualAmount = actualAmount;
    this.actualCurrency = actualCurrency;
    this.paymentSystem = paymentSystem;
    this.verificationStatus = verificationStatus;
    this.signature = signature;
    this.email = email;
    this.responseUrl = responseUrl;
    this.rawData = rawData || ({} as ReceiptData);
  }

  /**
   * Returns the raw order data used to create this receipt
   */
  public dumpFields(): ReceiptData {
    return {...this.rawData};
  }

  /**
   * Creates a Receipt instance from order data
   */
  static fromOrderData(orderData: ReceiptData, responseUrl?: string): Receipt {
    return new Receipt(
      orderData.masked_card,
      orderData.card_bin,
      Number(orderData.amount),
      orderData.payment_id,
      orderData.currency,
      orderData.order_status,
      orderData.tran_type,
      orderData.sender_cell_phone,
      orderData.sender_account,
      orderData.card_type,
      orderData.rrn,
      orderData.approval_code,
      orderData.response_code,
      orderData.product_id,
      orderData.rectoken,
      Receipt.parseEasyDate(orderData.rectoken_lifetime),
      orderData.reversal_amount,
      orderData.settlement_amount,
      orderData.settlement_currency,
      Receipt.parseEasyDate(orderData.settlement_date),
      orderData.eci,
      orderData.fee,
      orderData.actual_amount,
      orderData.actual_currency,
      orderData.payment_system,
      orderData.verification_status,
      orderData.signature,
      orderData.email,
      responseUrl,
      orderData,
    );
  }

  /**
   * Parses date strings in format "DD.MM.YYYY HH:mm:ss"
   * Returns undefined for invalid or empty input
   */
  private static parseEasyDate(dateString?: string): Date | undefined {
    if (!dateString?.trim()) {
      return undefined;
    }

    try {
      // Expected format: "05.01.2021 01:31:04"
      const [datePart, timePart] = dateString.split(' ');

      if (!datePart || !timePart) {
        return undefined;
      }

      const [day, month, year] = datePart.split('.').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);

      // Validate date components
      if (
        !Receipt.isValidDateComponent(day, 1, 31) ||
        !Receipt.isValidDateComponent(month, 1, 12) ||
        !Receipt.isValidDateComponent(year, 2000, 2100) ||
        !Receipt.isValidDateComponent(hours, 0, 23) ||
        !Receipt.isValidDateComponent(minutes, 0, 59) ||
        !Receipt.isValidDateComponent(seconds, 0, 59)
      ) {
        return undefined;
      }

      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch {
      return undefined;
    }
  }

  /**
   * Validates if a date component is within expected range
   */
  private static isValidDateComponent(
    value: number,
    min: number,
    max: number,
  ): boolean {
    return !isNaN(value) && value >= min && value <= max;
  }
}
