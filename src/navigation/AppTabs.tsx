import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import PetsListScreen from '../screens/PetsListScreen';
import VetHubScreen from '../screens/VetHubScreen';
import PetShopScreen from '../screens/PetShopScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GlassTabBar from './GlassTabBar';

export type AppTabsParamList = {
  Home: undefined;
  PetsList: undefined;
  Vet: undefined;
  PetShop: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'หน้าแรก', tabIcon: 'House' } as any}
      />
      <Tab.Screen
        name="PetsList"
        component={PetsListScreen}
        options={{ tabBarLabel: 'สัตว์เลี้ยง', tabIcon: 'PawPrint' } as any}
      />
      <Tab.Screen
        name="Vet"
        component={VetHubScreen}
        options={{ tabBarLabel: 'บริการสัตว์แพทย์', tabIcon: 'Stethoscope' } as any}
      />
      <Tab.Screen
        name="PetShop"
        component={PetShopScreen}
        options={{ tabBarLabel: 'ร้านค้า', tabIcon: 'ShoppingBag' } as any}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'ตั้งค่า', tabIcon: 'Settings' } as any}
      />
    </Tab.Navigator>
  );
}
