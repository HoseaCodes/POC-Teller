import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TellerAPI } from './api';

const HomeScreen = ({ navigation }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLinkedAccounts, setHasLinkedAccounts] = useState(false);

  // Load data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Function to load accounts data
  const loadData = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // Get access token from storage
      const accessToken = await TellerAPI.getAccessToken();
      
      if (!accessToken) {
        setHasLinkedAccounts(false);
        return;
      }
      
      // Fetch accounts using the access token
      const accountsData = await TellerAPI.getAccounts(accessToken);
      setAccounts(accountsData || []);
      setHasLinkedAccounts(Array.isArray(accountsData) && accountsData.length > 0);
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Do not show error alert on home screen
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Navigate to link account screen
  const navigateToLinkAccount = () => {
    navigation.navigate('Accounts', { 
      screen: 'LinkAccount'
    });
  };

  // Navigate to account details
  const navigateToAccountDetails = (account) => {
    navigation.navigate('Accounts', {
      screen: 'AccountDetail',
      params: { account }
    });
  };

  // Navigate to accounts list
  const navigateToAccountsList = () => {
    navigation.navigate('Accounts', {
      screen: 'AccountsList'
    });
  };

  // Format currency amount
  const formatAmount = (amount, currency = 'USD') => {
    if (!amount) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Calculate total balance across all accounts
  const calculateTotalBalance = () => {
    let total = 0;
    
    accounts.forEach(account => {
      // If this account has an available balance property, add it to the total
      if (account.balances && account.balances.available) {
        total += parseFloat(account.balances.available);
      }
    });
    
    return total;
  };

  // Render accounts summary
  const renderAccountsSummary = () => {
    const accountCount = accounts.length;
    const hasMultipleAccounts = accountCount > 1;
    
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>
            {hasLinkedAccounts ? 'Your Accounts' : 'Get Started'}
          </Text>
          {hasLinkedAccounts && (
            <TouchableOpacity
              onPress={navigateToAccountsList}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {hasLinkedAccounts ? (
          <View>
            <Text style={styles.accountCount}>
              {accountCount} {hasMultipleAccounts ? 'Accounts' : 'Account'} Connected
            </Text>
            
            {/* Display up to 3 accounts */}
            {accounts.slice(0, 3).map(account => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountItem}
                onPress={() => navigateToAccountDetails(account)}
              >
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.institutionName}>
                    {account.institution ? account.institution.name : 'Unknown Bank'}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
            
            {/* Show indicator for more accounts */}
            {accountCount > 3 && (
              <TouchableOpacity
                style={styles.moreAccountsButton}
                onPress={navigateToAccountsList}
              >
                <Text style={styles.moreAccountsText}>
                  +{accountCount - 3} more accounts
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.getStartedContainer}>
            <Text style={styles.getStartedText}>
              Connect your bank accounts to get started.
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={navigateToLinkAccount}
            >
              <Text style={styles.linkButtonText}>Link Bank Account</Text>
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#0066cc']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome to Financial App</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={navigateToLinkAccount}
        >
          <Ionicons name="add" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your accounts...</Text>
        </View>
      ) : (
        <>
          {renderAccountsSummary()}

          {hasLinkedAccounts && (
            <View style={styles.insightsCard}>
              <Text style={styles.insightsTitle}>Financial Insights</Text>
              
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <Ionicons name="wallet-outline" size={24} color="#0066cc" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Total Balance</Text>
                  <Text style={styles.insightValue}>{formatAmount(calculateTotalBalance())}</Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <View style={styles.insightIconContainer}>
                  <Ionicons name="analytics-outline" size={24} color="#43a047" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Account Overview</Text>
                  <Text style={styles.insightValue}>
                    {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} Connected
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    padding: 6,
  },
  viewAllText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  accountCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 14,
    color: '#666',
  },
  moreAccountsButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  moreAccountsText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  getStartedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  getStartedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  insightsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;