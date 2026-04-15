import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';

// Core Screens
import HomeScreen from './src/screens/HomeScreen';
import MapaPredioScreen from './src/screens/MapaPredioScreen';
import PotreroDetalleScreen from './src/screens/PotreroDetalleScreen';
import PaddockChartsScreen from './src/screens/PaddockChartsScreen';
import TasksScreen from './src/screens/TasksScreen';
import CostsSummaryScreen from './src/screens/CostsSummaryScreen';
import InvoiceDetailScreen from './src/screens/InvoiceDetailScreen';
import SoilAnalysisScreen from './src/screens/SoilAnalysisScreen';
import WagyuNutritionScreen from './src/screens/WagyuNutritionScreen';

// Operations & Alerts
import AlertsCenterScreen from './src/screens/operations/AlertsCenterScreen';
import AlertDetailScreen from './src/screens/operations/AlertDetailScreen';
import JaimeHomeScreen from './src/screens/operations/JaimeHomeScreen';
import TaskDetailQuickScreen from './src/screens/operations/TaskDetailQuickScreen';

// Monitoring (Weather & Drones)
import WeatherScreen from './src/screens/monitoring/WeatherScreen';
import WeatherDetailScreen from './src/screens/monitoring/WeatherDetailScreen';
import DroneDashboardScreen from './src/screens/monitoring/DroneDashboardScreen';
import ActiveMissionScreen from './src/screens/monitoring/ActiveMissionScreen';
import DroneCVResultsScreen from './src/screens/monitoring/DroneCVResultsScreen';
import FindingDetailScreen from './src/screens/monitoring/FindingDetailScreen';

// Intelligence (Agro/Vet/Meetings)
import ActiveDietScreen from './src/screens/intelligence/ActiveDietScreen';
import ForageAnalysisScreen from './src/screens/intelligence/ForageAnalysisScreen';
import HealthFileScreen from './src/screens/intelligence/HealthFileScreen';
import ActiveTreatmentScreen from './src/screens/intelligence/ActiveTreatmentScreen';
import MeetingBriefScreen from './src/screens/intelligence/MeetingBriefScreen';
import ActiveMeetingScreen from './src/screens/intelligence/ActiveMeetingScreen';

// Management & Assets
import MarketLotsScreen from './src/screens/management/MarketLotsScreen';
import ProviderDetailScreen from './src/screens/management/ProviderDetailScreen';
import OwnerDashboardScreen from './src/screens/management/OwnerDashboardScreen';
import PaddockOwnerDetailScreen from './src/screens/management/PaddockOwnerDetailScreen';
import MachineryDashboardScreen from './src/screens/management/MachineryDashboardScreen';
import MachineryDetailScreen from './src/screens/management/MachineryDetailScreen';
import CarModeDashboardScreen from './src/screens/management/CarModeDashboardScreen';
import PodcastPlayerScreen from './src/screens/management/PodcastPlayerScreen';
import FundoDetailScreen from './src/screens/management/FundoDetailScreen';
import AnimalesScreen from './src/screens/management/AnimalesScreen';
import FichaIndividualScreen from './src/screens/management/FichaIndividualScreen';

// Zootecnia Events (AUT-183 a AUT-190)
import PesajeMangaScreen from './src/screens/operations/PesajeMangaScreen';
import NacimientoRegistroScreen from './src/screens/operations/NacimientoRegistroScreen';
import DesteSessionScreen from './src/screens/operations/DesteSessionScreen';
import PrenezGestionScreen from './src/screens/operations/PrenezGestionScreen';
import VacunacionMangaScreen from './src/screens/operations/VacunacionMangaScreen';
import MovimientoPotreroScreen from './src/screens/operations/MovimientoPotreroScreen';
import EgresoRegistroScreen from './src/screens/operations/EgresoRegistroScreen';

// Zootecnia Events (AUT-195 a AUT-198)
import CeloRegistroScreen from './src/screens/operations/CeloRegistroScreen';
import AbortoRegistroScreen from './src/screens/operations/AbortoRegistroScreen';
import CondicionCorporalScreen from './src/screens/operations/CondicionCorporalScreen';
import MarcajeClasificacionScreen from './src/screens/operations/MarcajeClasificacionScreen';

// Alimentación (AUT-199 a AUT-204)
import IngredientesScreen from './src/screens/feeding/IngredientesScreen';
import RecetaTMRScreen from './src/screens/feeding/RecetaTMRScreen';
import CorralesScreen from './src/screens/feeding/CorralesScreen';
import ArmarCarroScreen from './src/screens/feeding/ArmarCarroScreen';
import RecorridoSobrasScreen from './src/screens/feeding/RecorridoSobrasScreen';
import ReportesAlimentacionScreen from './src/screens/feeding/ReportesAlimentacionScreen';
import SmartCowChatScreen from './src/screens/intelligence/SmartCowChatScreen';
import VetBrainChatScreen from './src/screens/intelligence/VetBrainChatScreen';
import AgroBrainChatScreen from './src/screens/intelligence/AgroBrainChatScreen';
import OwnBrainChatScreen from './src/screens/intelligence/OwnBrainChatScreen';

// ─────────────────────────────────────────────
// Tipos de navegación
// ─────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

export type RootStackParamList = {
  Home: undefined;
  MapaPredio: undefined;
  PotreroDetalle: { potreroId: string };
  PaddockCharts: { potreroId: string };
  Tasks: undefined;
  CostsSummary: undefined;
  InvoiceDetail: { invoiceId: string };
  SoilAnalysis: { potreroId: string };
  WagyuNutrition: { lotId: string };

  AlertsCenter: undefined;
  AlertDetail: { alertId: string };
  JaimeHome: undefined;
  TaskDetailQuick: { taskId: string };

  Weather: undefined;
  WeatherDetail: undefined;
  DroneDashboard: undefined;
  ActiveMission: undefined;
  DroneCVResults: undefined;
  FindingDetail: { findingId: string };

  ActiveDiet: { lotId: string };
  ForageAnalysis: { sampleId: string };
  HealthFile: { diio: string };
  ActiveTreatment: { treatmentId: string };
  MeetingBrief: { meetingId: string };
  ActiveMeeting: { meetingId: string };

  MarketLots: undefined;
  ProviderDetail: { providerId: string };
  OwnerDashboard: undefined;
  PaddockOwnerDetail: { paddockId: string };
  MachineryDashboard: undefined;
  MachineryDetail: { assetId: string };
  CarModeDashboard: undefined;
  PodcastPlayer: undefined;
  FundoDetail: undefined;
  AnimalesScreen: undefined;

  // Zootecnia Events (AUT-183 a AUT-190)
  PesajeManga: { loteId?: string; manga?: string };
  NacimientoRegistro: { potreroId?: string };
  DesteSession: { potreroId?: string };
  PrenezGestion: { loteId?: string; modo?: 'servicio' | 'diagnostico' };
  VacunacionManga: { loteId?: string; producto?: string };
  MovimientoPotrero: { loteId?: string };
  EgresoRegistro: { loteId?: string };
  FichaIndividual: { diio: string };

  // Zootecnia Events (AUT-195 a AUT-198)
  CeloRegistro: { potreroId?: string };
  AbortoRegistro: { potreroId?: string };
  CondicionCorporal: { loteId?: string };
  MarcajeClasificacion: { manga?: string };

  // Alimentación (AUT-199 a AUT-204)
  Ingredientes: undefined;
  RecetaTMR: { recetaId?: string };
  Corrales: undefined;
  ArmarCarro: { batchNum?: number };
  RecorridoSobras: { batchNum?: number };
  ReportesAlimentacion: undefined;
  SmartCowChat: undefined;
  VetBrainChat: undefined;
  AgroBrainChat: undefined;
  OwnBrainChat: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

// ─────────────────────────────────────────────
// Navegadores
// ─────────────────────────────────────────────

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

function AppNavigator({ initialRoute }: { initialRoute: keyof RootStackParamList }) {
  return (
    <AppStack.Navigator
      id={undefined}
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="MapaPredio" component={MapaPredioScreen} />
      <AppStack.Screen name="PotreroDetalle" component={PotreroDetalleScreen} />
      <AppStack.Screen name="PaddockCharts" component={PaddockChartsScreen} />
      <AppStack.Screen name="Tasks" component={TasksScreen} />
      <AppStack.Screen name="CostsSummary" component={CostsSummaryScreen} />
      <AppStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <AppStack.Screen name="SoilAnalysis" component={SoilAnalysisScreen} />
      <AppStack.Screen name="WagyuNutrition" component={WagyuNutritionScreen} />

      <AppStack.Screen name="AlertsCenter" component={AlertsCenterScreen} />
      <AppStack.Screen name="AlertDetail" component={AlertDetailScreen} />
      <AppStack.Screen name="JaimeHome" component={JaimeHomeScreen} />
      <AppStack.Screen name="TaskDetailQuick" component={TaskDetailQuickScreen} />

      <AppStack.Screen name="Weather" component={WeatherScreen} />
      <AppStack.Screen name="WeatherDetail" component={WeatherDetailScreen} />
      <AppStack.Screen name="DroneDashboard" component={DroneDashboardScreen} />
      <AppStack.Screen name="ActiveMission" component={ActiveMissionScreen} />
      <AppStack.Screen name="DroneCVResults" component={DroneCVResultsScreen} />
      <AppStack.Screen name="FindingDetail" component={FindingDetailScreen} />

      <AppStack.Screen name="ActiveDiet" component={ActiveDietScreen} />
      <AppStack.Screen name="ForageAnalysis" component={ForageAnalysisScreen} />
      <AppStack.Screen name="HealthFile" component={HealthFileScreen} />
      <AppStack.Screen name="ActiveTreatment" component={ActiveTreatmentScreen} />
      <AppStack.Screen name="MeetingBrief" component={MeetingBriefScreen} />
      <AppStack.Screen name="ActiveMeeting" component={ActiveMeetingScreen} />

      <AppStack.Screen name="MarketLots" component={MarketLotsScreen} />
      <AppStack.Screen name="ProviderDetail" component={ProviderDetailScreen} />
      <AppStack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <AppStack.Screen name="PaddockOwnerDetail" component={PaddockOwnerDetailScreen} />
      <AppStack.Screen name="MachineryDashboard" component={MachineryDashboardScreen} />
      <AppStack.Screen name="MachineryDetail" component={MachineryDetailScreen} />
      <AppStack.Screen name="CarModeDashboard" component={CarModeDashboardScreen} />
      <AppStack.Screen name="PodcastPlayer" component={PodcastPlayerScreen} />
      <AppStack.Screen name="FundoDetail" component={FundoDetailScreen} />
      <AppStack.Screen name="AnimalesScreen" component={AnimalesScreen} />

      {/* Zootecnia Events (AUT-183 a AUT-190) */}
      <AppStack.Screen name="PesajeManga" component={PesajeMangaScreen} />
      <AppStack.Screen name="NacimientoRegistro" component={NacimientoRegistroScreen} />
      <AppStack.Screen name="DesteSession" component={DesteSessionScreen} />
      <AppStack.Screen name="PrenezGestion" component={PrenezGestionScreen} />
      <AppStack.Screen name="VacunacionManga" component={VacunacionMangaScreen} />
      <AppStack.Screen name="MovimientoPotrero" component={MovimientoPotreroScreen} />
      <AppStack.Screen name="EgresoRegistro" component={EgresoRegistroScreen} />
      <AppStack.Screen name="FichaIndividual" component={FichaIndividualScreen} />

      {/* Zootecnia Events (AUT-195 a AUT-198) */}
      <AppStack.Screen name="CeloRegistro" component={CeloRegistroScreen} />
      <AppStack.Screen name="AbortoRegistro" component={AbortoRegistroScreen} />
      <AppStack.Screen name="CondicionCorporal" component={CondicionCorporalScreen} />
      <AppStack.Screen name="MarcajeClasificacion" component={MarcajeClasificacionScreen} />

      {/* Alimentación (AUT-199 a AUT-204) */}
      <AppStack.Screen name="Ingredientes" component={IngredientesScreen} />
      <AppStack.Screen name="RecetaTMR" component={RecetaTMRScreen} />
      <AppStack.Screen name="Corrales" component={CorralesScreen} />
      <AppStack.Screen name="ArmarCarro" component={ArmarCarroScreen} />
      <AppStack.Screen name="RecorridoSobras" component={RecorridoSobrasScreen} />
      <AppStack.Screen name="ReportesAlimentacion" component={ReportesAlimentacionScreen} />
      <AppStack.Screen name="SmartCowChat" component={SmartCowChatScreen} />
      <AppStack.Screen name="VetBrainChat" component={VetBrainChatScreen} />
      <AppStack.Screen name="AgroBrainChat" component={AgroBrainChatScreen} />
      <AppStack.Screen name="OwnBrainChat" component={OwnBrainChatScreen} />
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

  const isOperario = user?.rol === 'operador' || user?.rol === 'veterinario';
  const initialRoute: keyof RootStackParamList = isOperario ? 'JaimeHome' : 'OwnerDashboard';

  return (
    <NavigationContainer>
      {user ? <AppNavigator initialRoute={initialRoute} /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────

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
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
