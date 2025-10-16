import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {WebView, WebViewNavigationEvent} from 'react-native-webview';

import {Receipt} from './models';
import {Native} from './Native';

const addViewportMeta = `(${String(() => {
  const meta = document.createElement('meta');
  meta.setAttribute('content', 'width=device-width, user-scalable=0,');
  meta.setAttribute('name', 'viewport');
  const elementHead = document.getElementsByTagName('head');
  if (elementHead) {
    elementHead[0].appendChild(meta);
  } else {
    const head = document.createElement('head');
    head.appendChild(meta);
  }
})})();`;

interface Props {}

interface LoadingState {
  baseUrl: string;
  html: string;
  cookies: string | null;
  apiHost: string;
  callbackUrl: string;
}

type State = {status: 'idle'} | ({status: 'loading'} & LoadingState);

export class CloudipspWebView extends React.Component<Props, State> {
  state: State = {status: 'idle'};

  private readonly urlStartPattern =
    'http://secure-redirect.cloudipsp.com/submit/#';
  private readonly webViewRef = React.createRef<WebView>();
  private onSuccess?: (receipt: Receipt) => void;
  private onFailure?: () => void;

  readonly confirm = (
    baseUrl: string,
    html: string,
    cookies: string | null,
    apiHost: string,
    callbackUrl: string,
  ): Promise<Receipt> => {
    if (this.onSuccess) {
      throw new Error('CloudipspWebView already waiting for confirmation');
    }

    if (cookies && Platform.OS === 'android') {
      Native.addCookies(baseUrl, cookies);
    }

    this.setState({
      status: 'loading',
      baseUrl,
      html,
      cookies,
      apiHost,
      callbackUrl,
    });

    return new Promise((resolve, reject) => {
      this.onSuccess = resolve;
      this.onFailure = reject;
    });
  };

  private readonly onLoadStart = (event: WebViewNavigationEvent) => {
    if (!this.onSuccess || this.state.status !== 'loading') {
      return;
    }

    const {apiHost, callbackUrl} = this.state;
    const url = event.nativeEvent.url;

    const detectsStartPattern = url.startsWith(this.urlStartPattern);
    const detectsCallbackUrl = url.startsWith(callbackUrl);
    const detectsApiToken = url.startsWith(`${apiHost}/api/checkout?token=`);

    if (detectsStartPattern || detectsCallbackUrl || detectsApiToken) {
      this.handlePaymentSuccess(url, detectsStartPattern);
    }
  };

  private handlePaymentSuccess = (url: string, isStartPattern: boolean) => {
    let receipt: Receipt;

    if (isStartPattern) {
      const jsonOfConfirmation = url.split(this.urlStartPattern)[1];
      let response;
      try {
        response = JSON.parse(jsonOfConfirmation);
      } catch (e) {
        response = JSON.parse(decodeURIComponent(jsonOfConfirmation));
      }
      receipt = Receipt.fromOrderData(response.params);
    }

    this.setState({status: 'idle'}, () => {
      this.onSuccess!(receipt);
      this.clearCallbacks();
    });

    this.webViewRef.current?.goBack();
  };

  private clearCallbacks = () => {
    this.onSuccess = undefined;
    this.onFailure = undefined;
  };

  render(): React.ReactNode {
    if (this.state.status === 'idle') {
      return <View />;
    }

    const {baseUrl, html} = this.state;

    return (
      <WebView
        style={styles.webView}
        ref={this.webViewRef}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        source={{baseUrl, html}}
        injectedJavaScript={addViewportMeta}
        onLoadStart={this.onLoadStart}
      />
    );
  }
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});

export type CloudipspWebviewProvider = (
  callback: (webView: CloudipspWebView) => void,
) => void;

export interface CloudipspWebviewPrivate {
  confirm(
    baseUrl: string,
    html: string,
    cookies: string | null,
    apiHost: string,
    callbackUrl: string,
  ): Promise<Receipt>;
}
