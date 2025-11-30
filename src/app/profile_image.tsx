import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileImageScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to select a profile image.');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take a photo.');
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCompleteSetup = () => {
    // You can add logic here to upload the image or save it
    console.log('Profile image:', imageUri);
    // Navigate to the main app or home screen using replace to bypass guards
    router.replace('/protected');
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Profile Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black px-6 pt-20 pb-8">
      {/* Header */}
      <View className="mb-12">
        <Text className="text-white text-3xl font-bold mb-2">Profile Image</Text>
        <Text className="text-gray-400 text-base">Add a photo to personalize your profile</Text>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center">
        {/* Image Preview / Placeholder */}
        <TouchableOpacity 
          onPress={showImageOptions}
          className="mb-8"
          activeOpacity={0.7}
        >
          <View className="relative">
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                className="w-40 h-40 rounded-full"
              />
            ) : (
              <View className="w-40 h-40 rounded-full bg-gray-900 border-2 border-dashed border-gray-700 items-center justify-center">
                <Ionicons name="camera" size={48} color="#6B7280" />
              </View>
            )}
            
            {/* Edit Button Overlay */}
            <View className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-indigo-500 items-center justify-center border-4 border-black">
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={showImageOptions} className="mb-4">
          <Text className="text-indigo-500 font-semibold text-base">
            {imageUri ? 'Change Photo' : 'Add Photo'}
          </Text>
        </TouchableOpacity>

        {!imageUri && (
          <Text className="text-gray-500 text-sm text-center px-8">
            You can skip this step for now and add a photo later
          </Text>
        )}
      </View>

      {/* Complete Setup Button */}
      <Button
        title="Complete Setup"
        onPress={handleCompleteSetup}
      />
    </View>
  );
}
