import { Stack } from 'expo-router';

import { StatusBar } from 'expo-status-bar';
import { Platform, Text, useColorScheme, View } from 'react-native';
import '../../global.css';
import { useAuthStore } from '../store/auth_store';
import { useEffect } from 'react';
import { checkAuthStatus } from '../services/auth_service';
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations';

const expoDb = openDatabaseSync("db.db",{enableChangeListener: true});
const db = drizzle(expoDb);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isLoggedIn = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    checkAuthStatus();
  }, []);


  const { success, error } = useMigrations(db, migrations);
  if (error) {
    return (
      <View>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }
  if (!success) {
    return (
      <View>
        <Text>Migration is in progress...</Text>
      </View>
    );
  }


  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#000000',
          },
        }}
      >
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen
            name="landing"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="signin"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="otp_verification"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile_image"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen
            name="protected"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="protected/messaging_screeen"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
}
