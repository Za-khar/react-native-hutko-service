import {Platform} from 'react-native';
import {WebView as RNWebView} from 'react-native-webview';

import {ApplePayInfo, Native} from './Native';
import {CloudipspWebView, CloudipspWebviewProvider} from './CloudipspWebview';
import {
  Card,
  CardPrivate,
  Failure,
  Order,
  OrderPrivate,
  Receipt,
  ReceiptData,
  req,
} from './models';
import {ApiClient} from './models/ApiClient';

const DEFAULT_BASE_URL = 'https://pay.hutko.org/';
const DEFAULT_CALLBACK_URL = 'http://callback';

const ENDPOINTS = {
  MOBILE_PAY: 'api/checkout/ajax/mobile_pay',
  TOKEN: 'api/checkout/token',
  CHECKOUT_AJAX: 'api/checkout/ajax',
  MERCHANT_ORDER: 'api/checkout/merchant/order',
} as const;

type Currency = string;

interface MobilePayMethod {
  supportedMethods: string;
  data: unknown;
}

interface MobilePayResponse {
  payment_system: string;
  methods: MobilePayMethod[];
  details: {
    total: {
      label: string;
    };
  };
  error_message?: string;
  error_code?: string;
  request_id?: string;
}

interface TokenResponse {
  token: string;
}

interface OrderResponse {
  order_data: ReceiptData;
  response_url?: string;
  response_url_mobile?: string;
  response_status?: 'success' | 'failure';
  response?: unknown;
  error_message?: string;
  error_code?: number;
  request_id?: string;
}

interface CheckoutResponse {
  url: string;
  send_data: ThreeDSData;
}

interface ThreeDSData {
  PaReq: string;
  MD?: string;
  TermUrl?: string;
  [k: string]: unknown;
}

interface PaymentConfig {
  payment_system: string;
  data: unknown;
  businessName: string;
}

const padStart = (
  str: string | number,
  targetLength: number,
  padString: string = '0',
): string => {
  const string = String(str);
  if (string.length >= targetLength) {
    return string;
  }

  const padding = padString.repeat(targetLength);
  return (padding + string).slice(-targetLength);
};

export class Cloudipsp {
  private readonly merchantId: number;
  private readonly cloudipspView: CloudipspWebviewProvider;
  public baseUrl: string;
  private readonly callbackUrl: string;
  private readonly apiClient: ApiClient;

  constructor(
    merchantId: number = req('merchantId'),
    cloudipspView: CloudipspWebviewProvider = req('cloudipspView'),
    baseUrl?: string,
    callbackUrl?: string,
  ) {
    this.merchantId = merchantId;
    this.cloudipspView = cloudipspView;
    this.baseUrl = baseUrl
      ? baseUrl.endsWith('/')
        ? baseUrl
        : baseUrl + '/'
      : DEFAULT_BASE_URL;
    this.callbackUrl = callbackUrl ?? DEFAULT_CALLBACK_URL;
    this.apiClient = new ApiClient(this.baseUrl);

    // Quick runtime check — keep it as early failure for consumers
    if (!RNWebView) {
      throw new Error('"react-native-webview" module required');
    }
  }

  // -------------------------
  // Platform Helpers
  // -------------------------
  static async supportsApplePay(): Promise<boolean> {
    return Platform.OS === 'ios' ? Native.supportsApplePay() : false;
  }

  static async supportsGooglePay(): Promise<boolean> {
    return Platform.OS === 'android' ? Native.supportsGooglePay() : false;
  }

  private static assertApplePayAvailable(): void {
    if (Platform.OS !== 'ios') {
      throw new Error('ApplePay available only for iOS');
    }
  }

  private static assertGooglePayAvailable(): void {
    if (Platform.OS !== 'android') {
      throw new Error('GooglePay available only for Android');
    }
  }

  // -------------------------
  // Public Payments API
  // -------------------------
  async pay(
    card: Card = req('card'),
    order: Order = req('order'),
  ): Promise<Receipt> {
    if (!card.isValidCard()) throw new Error('Card is not valid');

    const token = await this.getToken(order);
    const checkout = await this.checkout(token, card, order.email);
    return this.continuePayment(checkout, token, this.callbackUrl);
  }

  async payToken(
    card: Card = req('card'),
    token: string = req('token'),
  ): Promise<Receipt> {
    if (!card.isValidCard()) throw new Error('Card is not valid');

    const callbackUrl = await this.getCallbackUrl(token);
    const checkout = await this.checkout(token, card, undefined);
    return this.continuePayment(checkout, token, callbackUrl);
  }

  // Apple Pay (order -> starts apple flow)
  async applePay(order: Order = req('order')): Promise<Receipt> {
    Cloudipsp.assertApplePayAvailable();

    const config = await this.getPaymentConfig(
      order.amount,
      order.currency,
      null,
      'https://apple.com/apple-pay',
      'ApplePay',
    );
    const appleInfo: ApplePayInfo = await Native.applePay(
      config,
      order.amount,
      order.currency,
      order.description,
    );

    const token = await this.getToken(order);
    const checkout = await this.checkoutApplePay(
      token,
      order.email,
      config.payment_system,
      appleInfo,
    );

    try {
      const receipt = await this.continuePayment(
        checkout,
        token,
        this.callbackUrl,
      );
      await Native.applePayComplete(true);
      return receipt;
    } catch (err) {
      await Native.applePayComplete(false);
      throw err;
    }
  }

  // Apple Pay when you already have token
  async applePayToken(token: string = req('token')): Promise<Receipt> {
    Cloudipsp.assertApplePayAvailable();

    const receiptFromToken = await this.getOrder(token);
    const config = await this.getPaymentConfig(
      null,
      null,
      token,
      'https://apple.com/apple-pay',
      'ApplePay',
    );

    const appleInfo: ApplePayInfo = await Native.applePay(
      config,
      receiptFromToken.amount,
      receiptFromToken.currency,
      ' ',
    );
    const checkout = await this.checkoutApplePay(
      token,
      receiptFromToken.email,
      config.payment_system,
      appleInfo,
    );

    try {
      const receipt = await this.continuePayment(
        checkout,
        token,
        receiptFromToken.responseUrl ?? this.callbackUrl,
      );
      await Native.applePayComplete(true);
      return receipt;
    } catch (err) {
      await Native.applePayComplete(false);
      throw err;
    }
  }

  // Google Pay (order)
  async googlePay(order: Order = req('order')): Promise<Receipt> {
    Cloudipsp.assertGooglePayAvailable();

    const config = await this.getPaymentConfig(
      order.amount,
      order.currency,
      null,
      'https://google.com/pay',
      'GooglePay',
    );
    const googlePayload = await Native.googlePay(config.data);
    const token = await this.getToken(order);
    const checkout = await this.checkoutGooglePay(
      token,
      order.email,
      config.payment_system,
      googlePayload,
    );

    return this.continuePayment(checkout, token, this.callbackUrl);
  }

  // Google Pay (token)
  async googlePayToken(token: string = req('token')): Promise<Receipt> {
    Cloudipsp.assertGooglePayAvailable();

    const receiptFromToken = await this.getOrder(token);
    const config = await this.getPaymentConfig(
      null,
      null,
      token,
      'https://google.com/pay',
      'GooglePay',
    );
    const googlePayload = await Native.googlePay(config.data);
    const checkout = await this.checkoutGooglePay(
      token,
      receiptFromToken.email,
      config.payment_system,
      googlePayload,
    );

    return this.continuePayment(
      checkout,
      token,
      receiptFromToken.responseUrl ?? this.callbackUrl,
    );
  }

  // -------------------------
  // Internal flows & helpers
  // -------------------------
  private async getPaymentConfig(
    amount: number | null,
    currency: Currency | null,
    token: string | null,
    methodId: string,
    methodName: string,
  ): Promise<PaymentConfig> {
    const request = token
      ? {token}
      : {merchant_id: this.merchantId, currency, amount};
    const response = (await this.apiClient.post<
      typeof request,
      MobilePayResponse
    >(ENDPOINTS.MOBILE_PAY, request)) as MobilePayResponse;

    // server-level error
    if (response.error_message) {
      this.throwResponseError(
        response.error_message,
        response.error_code,
        response.request_id,
      );
    }

    const method = response.methods.find(m => m.supportedMethods === methodId);
    if (!method) {
      if (token) {
        throw new Error(`${methodName} is not supported for token "${token}"`);
      }
      throw new Error(
        `${methodName} is not supported for merchant ${this.merchantId} and currency ${currency}`,
      );
    }

    const businessName = response.details?.total?.label ?? '';
    return {
      payment_system: response.payment_system,
      data: method.data,
      businessName,
    };
  }

  private async getToken(order: Order): Promise<string> {
    const body = this.buildTokenRequest(order);
    const response = await this.apiClient.post<
      Record<string, unknown>,
      TokenResponse
    >(ENDPOINTS.TOKEN, body);
    if (!response?.token)
      throw new Failure('Empty token response', '400', undefined);
    return response.token;
  }

  private buildTokenRequest(order: Order): Record<string, unknown> {
    const op = order as unknown as OrderPrivate;
    const base: Record<string, unknown> = {
      merchant_id: this.merchantId,
      amount: String(order.amount),
      currency: order.currency,
      order_id: order.orderId,
      order_desc: order.description,
      email: order.email,
      response_url: this.callbackUrl,
    };

    // add optional private fields only if present to avoid sending undefined
    if (op._productId) base.product_id = op._productId;
    if (op._paymentSystems) base.payment_systems = op._paymentSystems;
    if (op._defaultPaymentSystem)
      base.default_payment_system = op._defaultPaymentSystem;
    if (op._lifeTime) base.lifetime = op._lifeTime;
    base.merchant_data =
      op._merchantData === undefined ? '[]' : op._merchantData;
    if (op._version) base.version = op._version;
    if (op._serverCallbackUrl) base.server_callback_url = op._serverCallbackUrl;
    if (op._lang !== undefined) base.lang = String(op._lang);
    base.preauth = op._preAuth ? 'Y' : 'N';
    base.required_rectoken = op._requiredRecToken ? 'Y' : 'N';
    base.verification = op._verification ? 'Y' : 'N';
    if (op._verificationType)
      base.verification_type = op._verificationType.name;
    if (op._arguments) Object.assign(base, op._arguments);
    base.delayed = op._delayed ? 'Y' : 'N';

    return base;
  }

  private async checkout(
    token: string,
    card: Card,
    email?: string,
  ): Promise<CheckoutResponse> {
    const cp = card as unknown as CardPrivate;
    const mm = cp.__getExpMm__();
    const yy = cp.__getExpYy__();
    const expiry = `${padStart(mm, 2)}${yy}`;

    const payload: Record<string, unknown> = {
      card_number: cp.__getCardNumber__(),
      expiry_date: expiry,
      token,
      email,
      payment_system: 'card',
    };
    if (card.getSource() === 'form') payload.cvv2 = cp.__getCvv__();

    return this.apiClient.post<Record<string, unknown>, CheckoutResponse>(
      ENDPOINTS.CHECKOUT_AJAX,
      payload,
    );
  }

  private async checkoutApplePay(
    token: string,
    email: string,
    paymentSystem: string,
    applePayData: ApplePayInfo,
  ): Promise<CheckoutResponse> {
    const payload = {
      token,
      email,
      payment_system: paymentSystem,
      data: applePayData,
    };
    return this.apiClient.post<typeof payload, CheckoutResponse>(
      ENDPOINTS.CHECKOUT_AJAX,
      payload,
    );
  }

  private async checkoutGooglePay(
    token: string,
    email: string,
    paymentSystem: string,
    googlePayInfo: string,
  ): Promise<CheckoutResponse> {
    const parsed = JSON.parse(googlePayInfo);
    const payload = {token, email, payment_system: paymentSystem, data: parsed};
    return this.apiClient.post<typeof payload, CheckoutResponse>(
      ENDPOINTS.CHECKOUT_AJAX,
      payload,
    );
  }

  private async continuePayment(
    checkoutResponse: CheckoutResponse,
    token: string,
    callbackUrl: string,
  ): Promise<Receipt> {
    if (checkoutResponse.url.startsWith(callbackUrl)) {
      return this.getOrder(token);
    }
    await this.perform3ds(checkoutResponse, callbackUrl);
    return this.getOrder(token);
  }

  private async perform3ds(
    checkout: CheckoutResponse,
    callbackUrl: string,
  ): Promise<void> {
    const sendData = checkout.send_data;
    const isJson = sendData.PaReq === '';
    const body = isJson
      ? JSON.stringify(sendData)
      : `MD=${encodeURIComponent(String(sendData.MD ?? ''))}&PaReq=${encodeURIComponent(String(sendData.PaReq ?? ''))}&TermUrl=${encodeURIComponent(String(sendData.TermUrl ?? ''))}`;
    const contentType = isJson
      ? 'application/json'
      : 'application/x-www-form-urlencoded';

    const res = await fetch(checkout.url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': contentType,
        'User-Agent': 'React-Native',
      },
      body,
    });

    const cookies = res.headers.get('set-cookie');
    const html = await res.text();

    await this.cloudipspView((view: CloudipspWebView) =>
      view.confirm?.(
        checkout.url,
        html,
        cookies,
        this.baseUrl.replace(/https?:\/\//, '').replace(/\/$/, ''),
        callbackUrl,
      ),
    );
  }

  private async getCallbackUrl(token: string): Promise<string> {
    const response = await this.apiClient.post<{token: string}, OrderResponse>(
      ENDPOINTS.MERCHANT_ORDER,
      {token},
    );
    if (!response.response_url)
      throw new Failure('Missing response_url', undefined, undefined);
    return response.response_url;
  }

  private async getOrder(token: string): Promise<Receipt> {
    const response = await this.apiClient.post<{token: string}, OrderResponse>(
      ENDPOINTS.MERCHANT_ORDER,
      {token},
    );
    return Receipt.fromOrderData(response.order_data, response.response_url);
  }

  private throwResponseError(
    message?: string,
    code?: string,
    requestId?: string,
  ): never {
    throw new Failure(message ?? 'Server error', code, requestId);
  }
}
