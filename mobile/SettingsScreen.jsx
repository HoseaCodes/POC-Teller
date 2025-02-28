import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TellerAPI } from './api';

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [hasLinkedAccounts, setHasLinkedAccounts] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // Check if user has linked accounts
  useEffect(() => {
    checkLinkedAccounts();
  }, []);

  // Check if there are any linked accounts
  const checkLinkedAccounts = async () => {
    try {
      const accessToken = await TellerAPI.getAccessToken();
      setHasLinkedAccounts(!!accessToken);
    } catch (error) {
      console.error('Error checking linked accounts:', error);
    }
  };

  // Disconnect all linked accounts
  const disconnectAccounts = async () => {
    Alert.alert(
      'Disconnect Accounts',
      'Are you sure you want to disconnect all your bank accounts? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Clear the access token from storage
              await TellerAPI.clearAccessToken();
              
              // Update state
              setHasLinkedAccounts(false);
              
              // Show success message
              Alert.alert(
                'Accounts Disconnected',
                'All your bank accounts have been disconnected successfully.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error disconnecting accounts:', error);
              Alert.alert(
                'Error',
                'There was an error disconnecting your accounts. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render settings section
  const renderSection = (title, children) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>{children}</View>
      </View>
    );
  };

  // Render toggle setting
  const renderToggleSetting = (icon, title, value, onValueChange) => {
    return (
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={22} color="#0066cc" />
          </View>
          <Text style={styles.settingText}>{title}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e0e0e0', true: '#a3d3ff' }}
          thumbColor={value ? '#0066cc' : '#f0f0f0'}
        />
      </View>
    );
  };

  // Render button setting
  const renderButtonSetting = (icon, title, onPress, destructive = false) => {
    return (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <View style={styles.settingLeft}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={22}
              color={destructive ? '#e53935' : '#0066cc'}
            />
          </View>
          <Text style={[styles.settingText, destructive && styles.destructiveText]}>
            {title}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      )}

      <View style={styles.profileSection}>
        <View style={styles.profileIconContainer}>
          <Ionicons name="person" size={40} color="#0066cc" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Demo User</Text>
          <Text style={styles.profileEmail}>user@example.com</Text>
        </View>
      </View>

      {renderSection('Account Settings', (
        <>
          {hasLinkedAccounts ? (
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Accounts')}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="wallet-outline" size={22} color="#0066cc" />
                </View>
                <Text style={styles.settingText}>Manage Connected Accounts</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Accounts', { screen: 'LinkAccount' })}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="add-circle-outline" size={22} color="#0066cc" />
                </View>
                <Text style={styles.settingText}>Link Bank Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}

          {hasLinkedAccounts && (
            renderButtonSetting('log-out-outline', 'Disconnect All Accounts', disconnectAccounts, true)
          )}
        </>
      ))}

      {renderSection('App Settings', (
        <>
          {renderToggleSetting(
            'finger-print-outline',
            'Enable Biometric Authentication',
            biometricEnabled,
            setBiometricEnabled
          )}
          
          {renderToggleSetting(
            'notifications-outline',
            'Enable Notifications',
            notificationsEnabled,
            setNotificationsEnabled
          )}
          
          {renderToggleSetting(
            'moon-outline',
            'Dark Mode',
            darkModeEnabled,
            setDarkModeEnabled
          )}
        </>
      ))}

      {renderSection('About', (
        <>
          {renderButtonSetting('information-circle-outline', 'About This App', () => {
            Alert.alert(
              'About',
              'Demo Financial App v1.0.0\nPowered by Teller.io',
              [{ text: 'OK' }]
            );
          })}
          
          {renderButtonSetting('help-circle-outline', 'Help & Support', () => {
            Alert.alert(
              'Help & Support',
              'For assistance, please contact support@example.com',
              [{ text: 'OK' }]
            );
          })}
          
          {renderButtonSetting('document-text-outline', 'Privacy Policy', () => {
            Alert.alert(
              'Privacy Policy',
              'This app is for demonstration purposes only.',
              [{ text: 'OK' }]
            );
          })}
        </>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  profileIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
  },
  destructiveText: {
    color: '#e53935',
  },
});

export default SettingsScreen;