import React, { useState, useEffect } from 'react';
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
import { TellerAPI } from './api';

const AccountDetailScreen = ({ route, navigation }) => {
  const { account } = route.params;
  
  const [balances, setBalances] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    loadAccountData();
  }, []);

  // Load account data (balances and transactions)
  const loadAccountData = async () => {
    try {
      if (!refreshing) setLoading(true);
      
      // Get access token from storage
      const accessToken = await TellerAPI.getAccessToken();
      
      if (!accessToken) {
        Alert.alert('Error', 'Unable to access account data. Please reconnect your account.');
        return;
      }
      
      // Load balances and transactions in parallel
      const [balancesData, transactionsData] = await Promise.all([
        // Only fetch balances if the account has a balances link
        account.links && account.links.balances 
          ? TellerAPI.getBalances(accessToken, account.id)
          : Promise.resolve(null),
        
        // Only fetch transactions if the account has a transactions link
        account.links && account.links.transactions
          ? TellerAPI.getTransactions(accessToken, account.id)
          : Promise.resolve([])
      ]);
      
      setBalances(balancesData);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error loading account data:', error);
      Alert.alert('Error', 'Failed to load account data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadAccountData();
  };

  // Format currency amount
  const formatAmount = (amount) => {
    if (!amount) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format transaction date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render transaction item
  const renderTransactionItem = ({ item }) => {
    // Determine if the transaction is an expense or income
    const isExpense = parseFloat(item.amount) < 0;
    const absAmount = Math.abs(parseFloat(item.amount));
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.date)}
            {item.status === 'pending' && ' • Pending'}
          </Text>
          
          {item.details && item.details.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {item.details.category.charAt(0).toUpperCase() + item.details.category.slice(1)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            isExpense ? styles.expenseText : styles.incomeText
          ]}>
            {isExpense ? '-' : '+'}{formatAmount(absAmount)}
          </Text>
        </View>
      </View>
    );
  };

  // Render account summary
  const renderAccountSummary = () => {
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={styles.accountNumber}>
            •••• {account.last_four || '****'}
          </Text>
        </View>
        
        <View style={styles.balanceContainer}>
          {balances ? (
            <>
              {balances.available && (
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {formatAmount(balances.available)}
                  </Text>
                </View>
              )}
              
              {balances.ledger && (
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Ledger Balance</Text>
                  <Text style={styles.balanceAmount}>
                    {formatAmount(balances.ledger)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noBalanceText}>
              Balance information not available
            </Text>
          )}
        </View>
        
        <View style={styles.accountInfo}>
          <Text style={styles.institutionName}>
            {account.institution ? account.institution.name : 'Unknown Bank'}
          </Text>
          <Text style={styles.accountType}>
            {`${account.type ? account.type.charAt(0).toUpperCase() + account.type.slice(1) : ''} ${
              account.subtype || ''
            }`}
          </Text>
        </View>
      </View>
    );
  };

  // Render tabs
  const renderTabs = () => {
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'transactions' && styles.activeTabText
          ]}>
            Transactions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'details' && styles.activeTabText
          ]}>
            Account Details
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render loading state
  const renderLoading = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading account data...</Text>
      </View>
    );
  };

  // Render empty transactions state
  const renderEmptyTransactions = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No transactions found for this account.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderAccountSummary()}
      {renderTabs()}
      
      {renderLoading()}
      
      {!loading && activeTab === 'transactions' && (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyTransactions}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0066cc']}
            />
          }
        />
      )}
      
      {!loading && activeTab === 'details' && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Account Information</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Account ID</Text>
            <Text style={styles.detailValue}>{account.id}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Account Type</Text>
            <Text style={styles.detailValue}>
              {`${account.type ? account.type.charAt(0).toUpperCase() + account.type.slice(1) : 'Unknown'}`}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Subtype</Text>
            <Text style={styles.detailValue}>
              {account.subtype || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Currency</Text>
            <Text style={styles.detailValue}>{account.currency || 'USD'}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Institution</Text>
            <Text style={styles.detailValue}>
              {account.institution ? account.institution.name : 'Unknown Bank'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>
              {account.status ? account.status.charAt(0).toUpperCase() + account.status.slice(1) : 'Unknown'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  accountNumber: {
    fontSize: 14,
    color: '#666',
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noBalanceText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  institutionName: {
    fontSize: 14,
    color: '#666',
  },
  accountType: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  expenseText: {
    color: '#e53935',
  },
  incomeText: {
    color: '#43a047',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AccountDetailScreen;