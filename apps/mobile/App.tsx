import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import SmartCowChatScreen from './src/screens/management/SmartCowChatScreen';
import BastoneoScreen from './src/screens/management/BastoneoScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  SmartCowChat: { initialText?: string } | undefined;
  Bastoneo: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList>('Login');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('@smartcow:launched').then((val) => {
      setInitialRoute(val ? 'Login' : 'Splash');
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f1' }}>
        <ActivityIndicator color="#1e3a2f" />
      </View>
    );
  }

  return (
    <AuthStack.Navigator id={undefined} initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator id={undefined} initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="SmartCowChat" component={SmartCowChatScreen} />
      <AppStack.Screen name="Bastoneo" component={BastoneoScreen} />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f1' }}>
        <ActivityIndicator color="#1e3a2f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {__DEV__ || user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f1' }}>
        <ActivityIndicator color="#1e3a2f" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
