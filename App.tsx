import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useFonts } from 'expo-font';
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
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';
import BookAppointmentScreen from './src/screens/BookAppointmentScreen';
import HealthRecordsScreen from './src/screens/HealthRecordsScreen';
import VisitDetailScreen from './src/screens/VisitDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AddFeedingScheduleScreen from './src/screens/AddFeedingScheduleScreen';
import TeleVetScreen from './src/screens/TeleVetScreen';
import ChatScreen from './src/screens/ChatScreen';
import BookTeleVetScreen from './src/screens/BookTeleVetScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import SmartFeaturesScreen from './src/screens/SmartFeaturesScreen';
import SymptomCheckScreen from './src/screens/SymptomCheckScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
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
  PetDetail: { petId: string };
  AddPet: undefined;
  AppointmentDetail: { appointmentId: string };
  BookAppointment: undefined;
  HealthRecords: { petId: string };
  VisitDetail: { visitId: string };
  Notifications: undefined;
  AddFeedingSchedule: undefined;
  TeleVet: undefined;
  Chat: { conversationId: string; vetId?: string };
  BookTeleVet: undefined;
  Expenses: undefined;
  AddExpense: undefined;
  SmartFeatures: undefined;
  SymptomCheck: undefined;
  PetShop: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: { selectedIds?: string[] } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: semantic.background }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer theme={navTheme}>
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
            options={transparentHeader}
          />
          <Stack.Screen
            name="AddPet"
            component={AddPetScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="BookAppointment"
            component={BookAppointmentScreen}
            options={transparentHeader}
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
            options={transparentHeader}
          />
          <Stack.Screen
            name="AddFeedingSchedule"
            component={AddFeedingScheduleScreen}
            options={transparentHeader}
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
            name="BookTeleVet"
            component={BookTeleVetScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={transparentHeader}
          />
          <Stack.Screen
            name="AddExpense"
            component={AddExpenseScreen}
            options={transparentHeader}
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
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
