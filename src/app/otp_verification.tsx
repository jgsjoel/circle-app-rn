import { View, Text, TextInput, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useState, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyOtp } from '../services/auth_service';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const { username, phoneNumber } = useLocalSearchParams();

  const cleanUsername = Array.isArray(username) ? username[0] : username;
  const cleanMobile = Array.isArray(phoneNumber) ? phoneNumber[0] : phoneNumber;

  const handleOtpChange = (text: string, index: number) => {
    // Only allow single digit
    const cleaned = text.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleaned && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      alert('Please enter the complete 4-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    const sts = await verifyOtp({ mobile: cleanMobile, name: cleanUsername, otp: otpCode });

    if (sts) {
      setVerifyingOtp(false);
    }

    router.push('/profile_image');
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <SafeAreaView className='flex-1'>
      <KeyboardAvoidingView
        className="flex-1 bg-black"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 px-6 pt-20 pb-8">
          {/* Header */}
          <View className="mb-12">
            <Text className="text-white text-3xl font-bold mb-2">Verify OTP</Text>
            <Text className="text-gray-400 text-base">
              Enter the 4-digit code sent to your phone
            </Text>
          </View>

          {/* OTP Input */}
          <View className="flex-1">
            <View className="flex-row justify-center gap-4 mb-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className="w-16 h-16 bg-gray-900 text-white text-center text-2xl font-bold rounded-xl border-2 border-gray-800"
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend Code */}
            <View className="items-center">
              <Text className="text-gray-400 text-sm">
                Didn't receive the code?{' '}
                <Text className="text-indigo-500 font-semibold">Resend</Text>
              </Text>
            </View>
          </View>

          {/* Verify Button */}
          <Pressable
            onPress={handleVerify}
            className={
              "w-full bg-blue-600 py-4 rounded-xl flex items-center justify-center"}
          >
            {verifyingOtp ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Verify
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
