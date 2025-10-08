import {Platform} from 'react-native';
import {Failure} from './Failure';

interface ApiWrapper<T = unknown> {
  response_status?: 'success' | 'failure';
  response?: T;
  error_message?: string;
  error_code?: number;
  request_id?: string;
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`;
  }

  async post<TRequest, TResponse>(
    path: string,
    payload: TRequest,
  ): Promise<TResponse> {
    const url = this.buildUrl(path);
    if (__DEV__) {
      // minimal debug logging
      // eslint-disable-next-line no-console
      console.log(`Cloudipsp: POST ${url}`, payload);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'React-Native',
        'SDK-OS': Platform.OS,
        'SDK-Version': '1.0.0',
      },
      body: JSON.stringify({request: payload}),
    });

    const json = (await res.json()) as ApiWrapper<TResponse>;
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`Cloudipsp: Response ${url}`, json);
    }
    if (json.response_status === 'success' && json.response !== undefined) {
      return json.response;
    }

    // When the API returns a wrapped failure (or no response) we still return the wrapper to the caller
    // so the caller can handle error_message / error_code. We'll throw in caller where needed.
    // To preserve typing here, attempt to return response if present, otherwise throw generic.
    if (json.response !== undefined) {
      return json.response as TResponse;
    }

    throw new Failure(
      json.error_message ?? 'Unknown API error',
      json.error_code?.toString(),
      json.request_id,
    );
  }
}
