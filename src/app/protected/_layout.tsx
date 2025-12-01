import { ContactService } from '@/src/services/contact_sync';
import { mqttService } from '@/src/services/mqtt_service';
import { saveUserFromToken } from '@/src/utils/jwtUtil';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function ProtectedLayout() {

  const contactService = new ContactService();

  const sync = async () => {
    try {
      await contactService.syncContacts();
      console.log("Contacts synced successfully!");
    } catch (e) {
      console.error("Failed to sync contacts:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      sync();
      // connect to MQTT
      mqttService.connect({
        clientId: "rn-mobile-client",
      });

      // get stored JWT
      const token = await AsyncStorage.getItem("token");

      if (token) {
        await saveUserFromToken(token);
      }
    };

    init(); // call the async function
  }, []);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
      <Stack.Screen name="index" />
      <Stack.Screen name="video_call_screen" />
      <Stack.Screen name="messaging_screeen" />
    </Stack>
  );
}
