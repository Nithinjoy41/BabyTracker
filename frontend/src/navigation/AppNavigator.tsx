import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChildPickerScreen from '../screens/ChildPickerScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddLogScreen from '../screens/AddLogScreen';
import HistoryScreen from '../screens/HistoryScreen';
import VaccinesScreen from '../screens/VaccinesScreen';
import PhotosScreen from '../screens/PhotosScreen';
import PhotoViewerScreen from '../screens/PhotoViewerScreen';

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#6C63FF' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#6C63FF',
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Vaccines" component={VaccinesScreen} />
      <Tab.Screen name="Photos" component={PhotosScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, selectedChildId, children, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Auth Stack
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : !selectedChildId || children.length === 0 ? (
        // Initial Child Picker
        <RootStack.Screen name="ChildPicker" component={ChildPickerScreen} />
      ) : (
        // Main App
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen
            name="AddLog"
            component={AddLogScreen}
            options={{ headerShown: true, title: 'Add Log Entry', headerStyle: { backgroundColor: '#6C63FF' }, headerTintColor: '#fff' }}
          />
          <RootStack.Screen
            name="ChildPicker"
            component={ChildPickerScreen}
            options={{ headerShown: true, title: 'Switch Child', headerStyle: { backgroundColor: '#6C63FF' }, headerTintColor: '#fff' }}
          />
          <RootStack.Screen
            name="PhotoViewer"
            component={PhotoViewerScreen}
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
