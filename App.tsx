import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ensurePermission } from './src/lib/notifications';
import {
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
} from '@expo-google-fonts/google-sans';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import PetDetailScreen from './src/screens/PetDetailScreen';
import AddPetScreen from './src/screens/AddPetScreen';
import AddPetManualScreen from './src/screens/AddPetManualScreen';
import AddPetScanScreen from './src/screens/AddPetScanScreen';
import AddPetMicrochipScreen from './src/screens/AddPetMicrochipScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import HealthRecordsScreen from './src/screens/HealthRecordsScreen';
import VisitDetailScreen from './src/screens/VisitDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AddFeedingScheduleScreen from './src/screens/AddFeedingScheduleScreen';
import MealTimeSettingScreen from './src/screens/MealTimeSettingScreen';
import PetEditScreen from './src/screens/PetEditScreen';
import TeleVetScreen from './src/screens/TeleVetScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';
import { CallProvider } from './src/data/callContext';
import MiniCallOverlay from './src/components/MiniCallOverlay';
import BookTeleVetScreen from './src/screens/BookTeleVetScreen';
import VetDetailScreen from './src/screens/VetDetailScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SmartFeaturesScreen from './src/screens/SmartFeaturesScreen';
import SymptomCheckScreen from './src/screens/SymptomCheckScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import AppTabs from './src/navigation/AppTabs';
import { semantic } from './src/theme';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  // Tab-level routes — accessible via navigation.navigate
  Home: undefined;
  PetsList: undefined;
  Vet: undefined;
  Profile: undefined;
  // Stack-only routes above tabs
  PetDetail: { petId: string; flashMessage?: string };
  AddPet: undefined;
  AddPetScan: undefined;
  AddPetMicrochip: undefined;
  AddPetManual:
    | {
        prefill?: {
          name?: string;
          breed?: string;
          birthDate?: string;
          microchipId?: string;
          speciesLabel?: string;
          neutered?: boolean;
          neuteredDate?: string;
          neuteredClinic?: string;
        };
        startStep?: number;
      }
    | undefined;
  AppointmentDetail: { appointmentId: string };
  BookAppointment: { selectedVetId?: string } | undefined;
  HealthRecords: { petId: string };
  VisitDetail: { visitId: string };
  Notifications: undefined;
  AddFeedingSchedule: undefined;
  MealTimeSetting: { petId: string; scheduleId?: string };
  PetEdit: { petId: string };
  TeleVet: undefined;
  Chat: {
    conversationId: string;
    vetId?: string;
    aiMode?: boolean;
    petId?: string;
  };
  ChatList: undefined;
  VideoCall: { vetId: string };
  BookTeleVet: undefined;
  VetDetail: { vetId: string };
  Expenses: undefined;
  AddExpense: undefined;
  SmartFeatures: undefined;
  SymptomCheck: undefined;
  PetShop: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: { selectedIds?: string[] } | undefined;
  OrderTracking: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export { navigationRef };

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
    card: 'transparent',
    text: semantic.textPrimary,
    primary: semantic.primary,
    border: 'transparent',
  },
};

const transparentHeader = {
  title: '',
  headerShadowVisible: false,
  headerTransparent: true,
  headerTintColor: semantic.primary,
};

export default function App() {
  const [fontsLoaded] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  // Request notification permission once at app start (async, non-blocking).
  useEffect(() => {
    ensurePermission().catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: semantic.background }} />;
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
      <StatusBar style="dark" />
      <CallProvider>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="Main"
            component={AppTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PetDetail"
            component={PetDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddPet"
            component={AddPetScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddPetScan"
            component={AddPetScanScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddPetMicrochip"
            component={AddPetMicrochipScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="AddPetManual"
            component={AddPetManualScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="BookAppointment"
            component={BookAppointmentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HealthRecords"
            component={HealthRecordsScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="VisitDetail"
            component={VisitDetailScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddFeedingSchedule"
            component={AddFeedingScheduleScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MealTimeSetting"
            component={MealTimeSettingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PetEdit"
            component={PetEditScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TeleVet"
            component={TeleVetScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatList"
            component={ChatListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VideoCall"
            component={VideoCallScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen
            name="BookTeleVet"
            component={BookTeleVetScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VetDetail"
            component={VetDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SmartFeatures"
            component={SmartFeaturesScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="SymptomCheck"
            component={SymptomCheckScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Cart"
            component={CartScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OrderTracking"
            component={OrderTrackingScreen}
            options={{ headerShown: false }}
          />
          </Stack.Navigator>
        </NavigationContainer>
        <MiniCallOverlay />
      </CallProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
