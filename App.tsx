import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { navigationRef } from './src/lib/navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import {
  ensurePermission,
  setupNotificationCategories,
  snoozeFromResponse,
  ACTION_CONFIRM_FEED,
  ACTION_CONFIRM_WATER,
  ACTION_SNOOZE_5MIN,
} from './src/lib/notifications';
import { confirmScheduleFromExternal } from './src/data/schedulesContext';
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
import BookAppointmentSummaryScreen from './src/screens/BookAppointmentSummaryScreen';
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
import { ExpensesProvider } from './src/data/expensesContext';
import { AppointmentsProvider } from './src/data/appointmentsContext';
import { SchedulesProvider } from './src/data/schedulesContext';
import {
  NotifyPrefsProvider,
  useNotifyPrefs,
} from './src/data/notifyPrefsContext';
import { mockReminders } from './src/data/reminders';
import { syncReminderNotifications } from './src/lib/reminderScheduler';
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
import ProfileInfoScreen from './src/screens/ProfileInfoScreen';
import ConnectedClinicsScreen from './src/screens/ConnectedClinicsScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import HelpScreen from './src/screens/HelpScreen';
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
  BookAppointment:
    | {
        selectedVetId?: string;
        prefillPetId?: string;
        prefillMode?: 'online' | 'clinic';
        prefillDateISO?: string;
        prefillTime?: string;
        prefillNotes?: string;
      }
    | undefined;
  BookAppointmentSummary: {
    petId: string;
    mode: 'online' | 'clinic';
    dateISO: string;
    time: string;
    vetId: string;
    notes?: string;
  };
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
    initialPrompt?: string;
    initialReply?: string;
    /** Optional appointment context — used to gate the in-chat video call
     *  button to a 15-min window before the appointment time. */
    appointmentId?: string;
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
  ProfileInfo: undefined;
  ConnectedClinics: undefined;
  Security: undefined;
  Help: undefined;
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

/**
 * Drives one-shot iOS notification scheduling for appointments / vaccines /
 * medications: re-runs whenever prefs change so toggling "ล่วงหน้า 1 วัน" off
 * cancels every appointment's day-ahead reminder, etc.
 */
function ReminderSyncBridge() {
  const { preAppointment, preVaccine, preTreatment } = useNotifyPrefs();
  useEffect(() => {
    syncReminderNotifications(mockReminders, {
      preAppointment,
      preVaccine,
      preTreatment,
    }).catch(() => {});
  }, [preAppointment, preVaccine, preTreatment]);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
  });

  // Request notification permission + register iOS notification categories
  // (banner action buttons) once at app start. Also subscribe to taps on the
  // "ให้อาหารแล้ว" / "เปลี่ยนน้ำแล้ว" buttons so we can mark the schedule as
  // confirmed even if the user never opens the app.
  useEffect(() => {
    ensurePermission().catch(() => {});
    setupNotificationCategories().catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const action = response.actionIdentifier;
        if (action === ACTION_SNOOZE_5MIN) {
          snoozeFromResponse(response).catch(() => {});
          return;
        }
        if (
          action === ACTION_CONFIRM_FEED ||
          action === ACTION_CONFIRM_WATER
        ) {
          const data = response.notification.request.content.data as
            | { scheduleId?: string }
            | null;
          if (data?.scheduleId) confirmScheduleFromExternal(data.scheduleId);
        }
      },
    );
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: semantic.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <KeyboardProvider>
      <BottomSheetModalProvider>
      <StatusBar style="dark" />
      <CallProvider>
       <ExpensesProvider>
        <AppointmentsProvider>
        <SchedulesProvider>
         <NotifyPrefsProvider>
          <ReminderSyncBridge />
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
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookAppointment"
            component={BookAppointmentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookAppointmentSummary"
            component={BookAppointmentSummaryScreen}
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
          <Stack.Screen
            name="ProfileInfo"
            component={ProfileInfoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ConnectedClinics"
            component={ConnectedClinicsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Security"
            component={SecurityScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Help"
            component={HelpScreen}
            options={{ headerShown: false }}
          />
          </Stack.Navigator>
        </NavigationContainer>
         </NotifyPrefsProvider>
        </SchedulesProvider>
        </AppointmentsProvider>
       </ExpensesProvider>
        <MiniCallOverlay />
      </CallProvider>
      </BottomSheetModalProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
