// LandingScreen.tsx
import "../../global.css";
import React from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  Platform,
  StatusBar,
  Button,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from "expo-router";

export default function LandingScreen() {

  const checkPermissionsAndProceed = async () => {
    // Request Contacts Permission
    const { status: contactsStatus } = await Contacts.requestPermissionsAsync();

    // Request Media Permissions
    let mediaGranted = false;

    if (Platform.OS === 'android') {
      const sdkInt = Device.osBuildId ? parseInt(Device.osBuildId) : 0;
      if (sdkInt >= 33) {
        // Android 13+ needs separate photo/video permission
        const { status: photosStatus } = await MediaLibrary.requestPermissionsAsync();
        const { status: videosStatus } = await MediaLibrary.requestPermissionsAsync();
        mediaGranted = photosStatus === 'granted' && videosStatus === 'granted';
      } else {
        const { status: storageStatus } = await MediaLibrary.requestPermissionsAsync();
        mediaGranted = storageStatus === 'granted';
      }
    } else {
      const { status: photosStatus } = await MediaLibrary.requestPermissionsAsync();
      mediaGranted = photosStatus === 'granted';
    }

    // If all permissions granted, proceed
    if (contactsStatus === 'granted' && mediaGranted) {
      router.replace('/signin');
      return;
    }

    // If denied permanently, show alert to open settings
    if (
      contactsStatus === 'denied' ||
      !mediaGranted
    ) {
      Alert.alert(
        'Permissions Required',
        "You've permanently denied required permissions.\nPlease enable them from app settings.",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      // For first-time denials, just ask again
      Alert.alert('Permissions', 'Please grant all permissions to continue');
    }
  };


  return (
    <SafeAreaView className="flex-1 justify-between align-middle px-6 bg-black">
      {/* Top Section */}
      <View>
        <Text className="text-3xl font-bold mt-8 text-white text-center">
          Welcome to Circle
        </Text>
      </View>
      <View className="items-center mt-1">
        <Image
          style={{ width: 250, height: 250 }}
          source={require('../../assets/bg.png')}
          resizeMode="contain"
        />
      </View>
      <View className="mt-1">
        <Text className="text-gray-400 text-center mt-4 text-base px-4">
          Simple. Reliable. Secure messaging just like WhatsApp.
        </Text>
      </View>
      {/* Button */}
      <TouchableOpacity
        className="flex-row bg-blue-900 py-4 rounded-full items-center justify-center mb-12"
        onPress={checkPermissionsAndProceed}
      >
        <Text className="text-white font-semibold text-lg">Get Started</Text>
      </TouchableOpacity>

    </SafeAreaView>

  );
}
