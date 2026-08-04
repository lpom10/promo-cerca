import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import PromoDetailScreen from "@/features/promociones/screens/PromoDetailScreen";
import TicketDetailScreen from "@/features/tickets/screens/TicketDetailScreen";

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="PromoDetail" component={PromoDetailScreen} />
      <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
    </Stack.Navigator>
  );
}
