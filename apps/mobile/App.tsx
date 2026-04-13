import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import MapaPredioScreen from './src/screens/MapaPredioScreen';
import PotreroDetalleScreen from './src/screens/PotreroDetalleScreen';

export type RootStackParamList = {
  Home: undefined;
  MapaPredio: undefined;
  PotreroDetalle: { potreroId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList, 'Root'>();

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f6f1' }}>
        <ActivityIndicator color="#1e3a2f" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <NavigationContainer>
        <Stack.Navigator
          id="Root"
          initialRouteName="MapaPredio"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="MapaPredio" component={MapaPredioScreen} />
          <Stack.Screen name="PotreroDetalle" component={PotreroDetalleScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
