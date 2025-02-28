import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens
import AccountsScreen from './AccountsScreen';
import AccountDetailScreen from './AccountDetailScreen';
import LinkAccountScreen from './LinkAccountScreen';
import HomeScreen from './HomeScreen';
import SettingsScreen from './SettingsScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom back button
const CustomBackButton = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ flexDirection: 'row', alignItems: 'center' }}
  >
    <Ionicons name="chevron-back" size={24} color="#0066cc" />
    <Text style={{ color: '#0066cc', fontSize: 16, marginLeft: 2 }}>Back</Text>
  </TouchableOpacity>
);

// Accounts stack navigator
const AccountsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitle: 'Back',
        headerTintColor: '#0066cc',
      }}
    >
      <Stack.Screen
        name="AccountsList"
        component={AccountsScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={({ navigation }) => ({
          title: 'Account Details',
          headerLeft: () => (
            <CustomBackButton onPress={() => navigation.goBack()} />
          ),
        })}
      />
      <Stack.Screen
        name="LinkAccount"
        component={LinkAccountScreen}
        options={({ navigation }) => ({
          title: 'Link Bank Account',
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: 10 }}
            >
              <Text style={{ color: '#0066cc', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

// Settings stack navigator
const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

// Home stack navigator
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
    </Stack.Navigator>
  );
};

// Main tab navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Accounts') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Accounts"
        component={AccountsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

// App navigation container
const AppNavigation = () => {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};

export default AppNavigation;
