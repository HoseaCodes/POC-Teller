import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import PropTypes from 'prop-types';

const TellerConnect = ({
  applicationId,
  environment = 'sandbox',
  products = ['transactions', 'balance'],
  selectAccount = 'multiple',
  onSuccess,
  onExit,
  onFailure,
  containerStyle,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  // HTML content with Teller Connect script
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Teller Connect</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="teller-connect-container" style="width: 100%; height: 100%;"></div>
        <script src="https://cdn.teller.io/connect/connect.js"></script>
        <script>
          // Function to send messages to React Native
          function sendToReactNative(eventName, data) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: eventName,
              payload: data
            }));
          }

          // Initialize Teller Connect
          document.addEventListener("DOMContentLoaded", function() {
            var tellerConnect = TellerConnect.setup({
              applicationId: "${applicationId}",
              environment: "${environment}",
              products: ${JSON.stringify(products)},
              selectAccount: "${selectAccount}",
              onInit: function() {
                sendToReactNative('initialized', {});
              },
              onSuccess: function(enrollment) {
                sendToReactNative('success', enrollment);
              },
              onExit: function() {
                sendToReactNative('exit', {});
              },
              onFailure: function(error) {
                sendToReactNative('failure', error);
              }
            });

            // Open Teller Connect immediately
            tellerConnect.open();

            // Make tellerConnect available to React Native
            window.tellerConnect = tellerConnect;
          });
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'initialized':
          setLoading(false);
          break;
        case 'success':
          if (onSuccess) {
            onSuccess(data.payload);
          }
          break;
        case 'exit':
          if (onExit) {
            onExit();
          }
          break;
        case 'failure':
          if (onFailure) {
            onFailure(data.payload);
          }
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
      setError('Failed to communicate with Teller Connect');
    }
  };

  // Handle WebView errors
  const handleError = (err) => {
    console.error('WebView error:', err);
    setLoading(false);
    setError('Failed to load Teller Connect');
  };

  // Retry connection if there's an error
  const retryConnection = () => {
    setError(null);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ html: htmlContent }}
            originWhitelist={['*']}
            onMessage={handleMessage}
            onError={handleError}
            onHttpError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            style={styles.webview}
          />
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={styles.loadingText}>Loading Teller Connect...</Text>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

TellerConnect.propTypes = {
  applicationId: PropTypes.string.isRequired,
  environment: PropTypes.oneOf(['sandbox', 'development', 'production']),
  products: PropTypes.arrayOf(PropTypes.string),
  selectAccount: PropTypes.oneOf(['disabled', 'single', 'multiple']),
  onSuccess: PropTypes.func,
  onExit: PropTypes.func,
  onFailure: PropTypes.func,
  containerStyle: PropTypes.object,
};

export default TellerConnect;