import { Tabs, Redirect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        tabBarStyle: {
          paddingBottom: 5,
          height: 55,
        },
      }}
    >
      <Tabs.Screen
        name="income"
        options={{
          title: '🔑 Login',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="login" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="welcome"
        options={{
          title: '💰 Billetera',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
