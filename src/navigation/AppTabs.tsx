import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import PetsListScreen from '../screens/PetsListScreen';
import VetHubScreen from '../screens/VetHubScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GlassTabBar from './GlassTabBar';

export type AppTabsParamList = {
  Home: undefined;
  PetsList: undefined;
  Vet: undefined;
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
        options={{ tabBarLabel: 'สัตวแพทย์', tabIcon: 'Stethoscope' } as any}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'โปรไฟล์', tabIcon: 'User' } as any}
      />
    </Tab.Navigator>
  );
}
