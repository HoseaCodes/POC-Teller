import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TellerConnect from './TellerConnect';
import { TellerAPI } from './api';

const LinkAccountScreen = ({ navigation }) => {
  const [showTellerConnect, setShowTellerConnect] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Clean up if needed when screen loses focus
      };
    }, [])
  );

  // Handle successful enrollment
  const handleEnrollmentSuccess = async (enrollment) => {
    try {
      setLoading(true);
      
      console.log('Enrollment successful:', enrollment);
      
      // Process the enrollment with your backend
      await TellerAPI.processEnrollment(enrollment);
      
      // Hide Teller Connect
      setShowTellerConnect(false);
      
      // Show success message
      Alert.alert(
        'Account Linked',
        'Your bank account has been successfully linked.',
        [{ text: 'OK', onPress: () => navigation.navigate('Accounts') }]
      );
    } catch (error) {
      console.error('Error processing enrollment:', error);
      Alert.alert(
        'Error',
        'There was an error processing your account connection. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle exit from Teller Connect
  const handleExit = () => {
    setShowTellerConnect(false);
  };

  // Handle failure in Teller Connect
  const handleFailure = (error) => {
    console.error('Teller Connect error:', error);
    setShowTellerConnect(false);
    
    Alert.alert(
      'Connection Failed',
      'There was an error connecting to your bank. Please try again.',
      [{ text: 'OK' }]
    );
  };

  // Start the Teller Connect flow
  const startTellerConnect = () => {
    setShowTellerConnect(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Link Your Bank Account</Text>
      
      <Text style={styles.description}>
        Connect your bank account to enable financial features in this app. 
        We use Teller.io to securely connect to your bank.
      </Text>
      
      <TouchableOpacity 
        style={styles.linkButton} 
        onPress={startTellerConnect}
        disabled={loading}
      >
        <Text style={styles.linkButtonText}>
          {loading ? 'Processing...' : 'Link Bank Account'}
        </Text>
      </TouchableOpacity>
      
      {/* Display Teller Connect in a Modal */}
      <Modal
        visible={showTellerConnect}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleExit}
      >
        <TellerConnect
          applicationId="app_pag5q47u3c4t3ag086000" // Replace with your app ID
          environment="sandbox" // Use 'development' or 'production' for real connections
          products={['transactions', 'balance']} // Adjust based on your needs
          selectAccount="multiple" // Allow multiple account selection
          onSuccess={handleEnrollmentSuccess}
          onExit={handleExit}
          onFailure={handleFailure}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  linkButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LinkAccountScreen;