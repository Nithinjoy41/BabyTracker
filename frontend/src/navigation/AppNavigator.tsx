import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
import BirthdayPlannerScreen from '../screens/BirthdayPlannerScreen';
import BabyPacman from '../screens/BabyPacman';

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
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border },
        headerTitleStyle: { fontWeight: '800' }
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home', headerShown: false }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Log History' }} />
      <Tab.Screen name="Vaccines" component={VaccinesScreen} options={{ title: 'Vaccinations' }} />
      <Tab.Screen name="Photos" component={PhotosScreen} options={{ title: 'Memory Box' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, selectedChildId, children, isLoading } = useAuth();
  console.log('[NAV] token:', !!token, 'selected:', selectedChildId, 'kids:', children.length, 'loading:', isLoading);

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
        <RootStack.Screen name="InitialChildPicker" component={ChildPickerScreen} />
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
          <RootStack.Screen
            name="BirthdayPlanner"
            component={BirthdayPlannerScreen}
            options={{ headerShown: true, title: 'Birthday Planner', headerStyle: { backgroundColor: '#FF6B6B' }, headerTintColor: '#fff' }}
          />
          <RootStack.Screen
            name="BabyPacman"
            component={BabyPacman}
            options={{ headerShown: false }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}
