import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TellerAPI } from './api';

const AccountsScreen = ({ navigation }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load accounts when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  // Function to load accounts from API
  const loadAccounts = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      // Get access token from storage
      const accessToken = await TellerAPI.getAccessToken();
      
      if (!accessToken) {
        setError('No linked accounts found');
        return;
      }
      
      // Fetch accounts using the access token
      const accountsData = await TellerAPI.getAccounts(accessToken);
      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  // Navigate to account details
  const navigateToAccountDetails = (account) => {
    navigation.navigate('AccountDetail', { account });
  };

  // Navigate to link new account
  const navigateToLinkAccount = () => {
    navigation.navigate('LinkAccount');
  };

  // Render account item
  const renderAccountItem = ({ item }) => {
    // Format currency amount
    const formatAmount = (amount) => {
      if (!amount) return '$0.00';
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: item.currency || 'USD',
      }).format(amount);
    };

    // Get account balance text (use available if present, otherwise ledger)
    const getBalanceText = () => {
      if (item.links && item.links.balances) {
        return 'Tap to view balance';
      }
      return 'Balance not available';
    };

    return (
      <TouchableOpacity
        style={styles.accountItem}
        onPress={() => navigateToAccountDetails(item)}
      >
        <View style={styles.accountHeader}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountType}>
            {`${item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : ''} ${
              item.subtype || ''
            }`}
          </Text>
        </View>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountNumber}>
            •••• {item.last_four || '****'}
          </Text>
          <Text style={styles.balanceText}>
            {getBalanceText()}
          </Text>
        </View>
        
        <View style={styles.accountFooter}>
          <Text style={styles.institutionName}>
            {item.institution ? item.institution.name : 'Unknown Bank'}
          </Text>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          {error || 'No linked accounts found'}
        </Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={navigateToLinkAccount}
        >
          <Text style={styles.linkButtonText}>Link Bank Account</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Accounts</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={navigateToLinkAccount}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccountItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0066cc']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  addButtonText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  accountItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountHeader: {
    marginBottom: 8,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
  },
  balanceText: {
    fontSize: 14,
    color: '#0066cc',
  },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  institutionName: {
    fontSize: 14,
    color: '#666',
  },
  detailsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  detailsButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  linkButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default AccountsScreen;