declare module 'react-native-webview' {
  import {Component, ReactElement, Ref} from 'react';
  import {StyleProp, ViewStyle} from 'react-native';

  export interface WebViewSourceUri {
    uri: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }

  export interface WebViewSourceHtml {
    html: string;
    baseUrl?: string;
  }

  export type WebViewSource = WebViewSourceUri | WebViewSourceHtml | number;

  export interface WebViewNativeEvent {
    url: string;
    title: string;
    loading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
    lockIdentifier?: number;
  }

  export interface WebViewNavigationEvent {
    nativeEvent: WebViewNativeEvent;
  }

  export interface WebViewErrorEvent {
    nativeEvent: {
      domain?: string;
      code: number;
      description: string;
      url: string;
      loading?: boolean;
      canGoBack?: boolean;
      canGoForward?: boolean;
    };
  }

  export interface WebViewMessageEvent {
    nativeEvent: {
      data: string;
      url: string;
      loading?: boolean;
      canGoBack?: boolean;
      canGoForward?: boolean;
    };
  }

  export interface WebViewProgressEvent {
    nativeEvent: {
      progress: number;
      url: string;
      loading?: boolean;
      canGoBack?: boolean;
      canGoForward?: boolean;
    };
  }

  export interface WebViewRef {
    injectJavaScript: (script: string) => void;
    goBack: () => void;
    goForward: () => void;
    reload: () => void;
    stopLoading: () => void;
    postMessage: (message: string) => void;
    requestFocus: () => void;
  }

  export interface WebViewProps {
    // Source
    source: WebViewSource;

    // Basic props
    style?: StyleProp<ViewStyle>;
    javaScriptEnabled?: boolean;
    domStorageEnabled?: boolean;
    scalesPageToFit?: boolean;
    startInLoadingState?: boolean;
    injectedJavaScript?: string;
    injectedJavaScriptBeforeContentLoaded?: string;

    // Events
    onLoad?: (event: WebViewNavigationEvent) => void;
    onLoadStart?: (event: WebViewNavigationEvent) => void;
    onLoadEnd?: (event: WebViewNavigationEvent | WebViewErrorEvent) => void;
    onLoadProgress?: (event: WebViewProgressEvent) => void;
    onError?: (event: WebViewErrorEvent) => void;
    onMessage?: (event: WebViewMessageEvent) => void;
    onNavigationStateChange?: (event: WebViewNativeEvent) => void;
    onContentProcessDidTerminate?: (event: WebViewNavigationEvent) => void;

    // Loading
    renderLoading?: () => ReactElement;
    renderError?: (
      errorDomain: string | undefined,
      errorCode: number,
      errorDesc: string,
    ) => ReactElement;

    // Android specific
    allowFileAccess?: boolean;
    allowsFullscreenVideo?: boolean;

    // iOS specific
    allowsBackForwardNavigationGestures?: boolean;
    allowsLinkPreview?: boolean;
    bounces?: boolean;

    // Refs
    ref?: Ref<WebViewRef>;

    // Children
    children?: React.ReactNode;
  }

  export class WebView extends Component<WebViewProps> {
    injectJavaScript: (script: string) => void;
    goBack: () => void;
    goForward: () => void;
    reload: () => void;
    stopLoading: () => void;
    postMessage: (message: string) => void;
    requestFocus: () => void;
  }

  export default WebView;
}
