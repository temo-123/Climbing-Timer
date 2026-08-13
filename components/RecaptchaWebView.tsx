import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { getApiBaseUrl } from '../utils/api';

export interface RecaptchaWebViewHandle {
  // Resolves with a fresh reCAPTCHA v3 token, or '' if the page failed/timed
  // out — the backend simply skips the check when it's not configured
  // (ReCaptchaV3Service::isConfigured()), so '' is a safe default either way.
  getToken: () => Promise<string>;
}

const TIMEOUT_MS = 8000;

// climbing.ge already ships a page built specifically for this: it loads
// Google's v3 challenge against a real registered domain (v3 site keys are
// domain-bound — an inline/data: WebView source won't validate) and posts the
// token back via window.ReactNativeWebView.postMessage (routes/web.php's
// /recaptcha-mobile.html, resources/views/site/recaptcha-mobile.blade.php).
const RecaptchaWebView = forwardRef<RecaptchaWebViewHandle>((_, ref) => {
  const webviewRef = useRef<WebView>(null);
  const resolverRef = useRef<((token: string) => void) | null>(null);
  const [siteOrigin, setSiteOrigin] = useState<string | null>(null);

  useEffect(() => {
    getApiBaseUrl().then(base => setSiteOrigin(base.replace(/\/api\/?$/, '')));
  }, []);

  const resolveOnce = (token: string) => {
    if (resolverRef.current) {
      resolverRef.current(token);
      resolverRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    getToken: () =>
      new Promise<string>(resolve => {
        if (!siteOrigin) { resolve(''); return; }
        resolverRef.current = resolve;
        webviewRef.current?.reload(); // mints a fresh token — v3 tokens are single-use
        setTimeout(() => resolveOnce(''), TIMEOUT_MS);
      }),
  }));

  const onMessage = (event: WebViewMessageEvent) => resolveOnce(event.nativeEvent.data ?? '');

  if (!siteOrigin) return null;

  return (
    <View style={{ position: 'absolute', top: -1000, left: 0, width: 1, height: 1 }} pointerEvents="none">
      <WebView
        ref={webviewRef}
        source={{ uri: `${siteOrigin}/recaptcha-mobile.html` }}
        onMessage={onMessage}
        javaScriptEnabled
        onError={() => resolveOnce('')}
      />
    </View>
  );
});

export default RecaptchaWebView;
