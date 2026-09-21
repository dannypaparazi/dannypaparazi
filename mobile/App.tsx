import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import ScannerScreen from './src/screens/ScannerScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scanner">
          <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan Device' }} />
          <Stack.Screen name="Confirm" component={ConfirmScreen} options={{ title: 'Confirm Details' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Scan History' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
