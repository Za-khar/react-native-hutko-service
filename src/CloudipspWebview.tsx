import React, {useRef, useState, useCallback} from 'react';
import {Platform, View, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {WebViewNavigationEvent} from 'react-native-webview/lib/WebViewTypes';

import {Receipt} from './models';
import {Native} from './Native';

const URL_START_PATTERN = 'http://secure-redirect.cloudipsp.com/submit/#';

const addViewportMeta = `(${String(() => {
  const meta = document.createElement('meta');
  meta.setAttribute('content', 'width=device-width, user-scalable=0');
  meta.setAttribute('name', 'viewport');

  const elementHead = document.getElementsByTagName('head');
  if (elementHead?.[0]) {
    elementHead[0].appendChild(meta);
  } else {
    const head = document.createElement('head');
    head.appendChild(meta);
    document.documentElement.prepend(head);
  }
})})();`;

interface WebViewState {
  baseUrl?: string;
  html?: string;
  cookies?: string | null;
  apiHost?: string;
  callbackUrl?: string;
}

interface CloudipspWebViewProps {}

export interface ConfirmationParams {
  baseUrl: string;
  html: string;
  cookies: string | null;
  apiHost: string;
  callbackUrl: string;
}

const useWebViewState = () => {
  const [state, setState] = useState<WebViewState>({});

  const setWebViewState = useCallback((newState: WebViewState) => {
    setState(newState);
  }, []);

  const resetState = useCallback(() => {
    setState({});
  }, []);

  return {
    state,
    setWebViewState,
    resetState,
  };
};

export const CloudipspWebView: React.FC<CloudipspWebViewProps> & {
  __confirm__?: (params: ConfirmationParams) => Promise<Receipt>;
} = () => {
  const webViewRef = useRef<WebView>(null);
  const {state, setWebViewState, resetState} = useWebViewState();

  const callbacksRef = useRef<{
    onSuccess?: (receipt: Receipt) => void;
    onFailure?: () => void;
  }>({});

  const __confirm__ = useCallback(
    ({
      baseUrl,
      html,
      cookies,
      apiHost,
      callbackUrl,
    }: ConfirmationParams): Promise<Receipt> => {
      if (callbacksRef.current.onSuccess) {
        throw new Error('CloudipspWebView already waiting for confirmation');
      }

      if (cookies && Platform.OS === 'android') {
        Native.addCookies(baseUrl, cookies);
      }

      setWebViewState({baseUrl, html, cookies, apiHost, callbackUrl});

      return new Promise((resolve, reject) => {
        callbacksRef.current = {onSuccess: resolve, onFailure: reject};
      });
    },
    [setWebViewState],
  );

  const handleLoadStart = useCallback(
    (event: WebViewNavigationEvent) => {
      const {onSuccess} = callbacksRef.current;
      const {baseUrl, apiHost, callbackUrl} = state;

      if (!onSuccess || !baseUrl || !apiHost || !callbackUrl) {
        return;
      }

      const url = event.nativeEvent.url;

      const detectsStartPattern = url.startsWith(URL_START_PATTERN);
      const detectsCallbackUrl = url.startsWith(callbackUrl);
      const detectsApiToken = url.startsWith(`${apiHost}/api/checkout?token=`);

      if (detectsStartPattern || detectsCallbackUrl || detectsApiToken) {
        let receipt: Receipt | null = null;

        if (detectsStartPattern) {
          const jsonOfConfirmation = url.split(URL_START_PATTERN)[1];
          let response;

          try {
            response = JSON.parse(jsonOfConfirmation);
          } catch {
            response = JSON.parse(decodeURIComponent(jsonOfConfirmation));
          }

          receipt = Receipt.fromOrderData(response.params);
        }

        resetState();
        !!receipt && onSuccess(receipt);
        callbacksRef.current = {};
        webViewRef.current?.goBack();
      }
    },
    [state, resetState],
  );

  const renderWebView = useCallback(() => {
    if (!state.baseUrl || !state.html) return null;

    return (
      <WebView
        style={styles.webview}
        ref={webViewRef}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        source={{baseUrl: state.baseUrl, html: state.html}}
        injectedJavaScript={addViewportMeta}
        onLoadStart={handleLoadStart}
      />
    );
  }, [state.baseUrl, state.html, handleLoadStart]);

  CloudipspWebView.__confirm__ = __confirm__;

  if (!state.baseUrl) {
    return <View style={styles.container} />;
  }

  return renderWebView();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export type CloudipspWebviewProvider = (
  callback: (webView: typeof CloudipspWebView) => void,
) => void;

export interface CloudipspWebviewPrivate {
  __confirm__(params: ConfirmationParams): Promise<Receipt>;
}
