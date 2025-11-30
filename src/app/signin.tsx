import { View, Text, TextInput, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createOrUpdate } from '../services/auth_service';

export default function SignInScreen() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);

    const handlePhoneNumberChange = (text: string) => {
        // Only allow digits and limit to 9 characters
        const cleaned = text.replace(/[^0-9]/g, '');
        if (cleaned.length <= 9) {
            setPhoneNumber(cleaned);
        }
    };

    const handleNext = async () => {
        // Validate inputs
        if (username.trim() === '' || phoneNumber.length !== 9) {
            alert('Please enter a valid username and phone number');
            return;
        }
        setSendingRequest(true);
        // Navigate to OTP verification
        const sts = await createOrUpdate({ name:username, mobile:phoneNumber });
        if (sts) {
            setSendingRequest(false);
            console.log(username, phoneNumber);
            router.push({
                pathname: "/otp_verification",
                params: {
                  username,
                  phoneNumber
                }
              });
              
        }
    };

    const isFormValid = username.trim() !== '' && phoneNumber.length === 9;

    return (
        <SafeAreaView className='flex-1'>
            <KeyboardAvoidingView
                className="flex-1 bg-black"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View className="flex-1 px-6 pt-20 pb-8">
                    {/* Header */}
                    <View className="mb-12">
                        <Text className="text-white text-3xl font-bold mb-2">Sign In</Text>
                        <Text className="text-gray-400 text-base">Enter your details to continue</Text>
                    </View>

                    {/* Form */}
                    <View className="flex-1">
                        {/* Username Input */}
                        <View className="mb-6">
                            <Text className="text-white text-sm font-medium mb-2">Username</Text>
                            <TextInput
                                className="bg-gray-900 text-white px-4 py-4 rounded-xl text-base border border-gray-800"
                                placeholder="Enter your username"
                                placeholderTextColor="#6B7280"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Phone Number Input */}
                        <View className="mb-6">
                            <Text className="text-white text-sm font-medium mb-2">Phone Number</Text>
                            <View className="flex-row items-center bg-gray-900 rounded-xl border border-gray-800">
                                <View className="px-4 py-4 border-r border-gray-800">
                                    <Text className="text-white text-base font-medium">+94</Text>
                                </View>
                                <TextInput
                                    className="flex-1 text-white px-4 py-4 text-base"
                                    placeholder="771234567"
                                    placeholderTextColor="#6B7280"
                                    value={phoneNumber}
                                    onChangeText={handlePhoneNumberChange}
                                    keyboardType="phone-pad"
                                    maxLength={9}
                                />
                            </View>
                            <Text className="text-gray-500 text-xs mt-1">
                                Enter 9 digits (without leading 0)
                            </Text>
                        </View>
                    </View>

                    {/* Next Button */}
                    <Pressable
                        onPress={handleNext}
                        className={
                            "w-full bg-blue-600 py-4 rounded-xl flex items-center justify-center"}
                    >
                        {sendingRequest ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-semibold text-base">
                                Next
                            </Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
