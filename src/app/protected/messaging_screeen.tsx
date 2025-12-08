import React, { useState, useRef, useEffect, use } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Modal,
    TouchableOpacity,
    Animated,
    Alert,
    BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useMessagingStore } from "@/src/store/messageing_store";
import { getMessagesWithMedia, saveMessage } from "@/src/services/messaging_service";
import { nanoid } from "nanoid/non-secure";

type Message = {
    id: string;
    text: string;
    sender: "me" | "other";
};

type AttachmentOption = {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    action: () => void;
};

export default function MessagingScreen() {
    const { user,clearCurrentChat } = useMessagingStore(); // get current user
    const { contact } = useLocalSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;


    useEffect(() => {
        const backAction = () => {
            clearCurrentChat(); // clear current user
          router.back(); // navigate back
          return true; // prevent default behavior
        };
      
        const backHandler = BackHandler.addEventListener(
          "hardwareBackPress",
          backAction
        );
      
        return () => backHandler.remove();
      }, []);

    useEffect(() => {
        if (!user?.localChatId) return;
    
        const loadMessages = async () => {
            try {
                const dbMessages = await getMessagesWithMedia(user.localChatId);
    
                const formatted = dbMessages.map((m) => ({
                    id: m.messageId,
                    text: m.message,
                    sender: m.fromMe ? "me" : "other",
                }));
    
                setMessages(formatted as Message[]);
    
                // Scroll to bottom once loaded
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                }, 100);
            } catch (err) {
                console.error("Error loading messages:", err);
            }
        };
    
        loadMessages();
    }, []);
    


    // Inside your component
    const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

    // Add this function to handle emoji selection
    const onEmojiClick = (emojiData: { emoji: string }) => {
        setInput((prev) => prev + emojiData.emoji);
        setEmojiPickerVisible(false); // optional: hide picker after selection
    };


    const sendMessage = async () => {
        if (!input.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: "me",
        };
        await saveMessage({
            messageId: nanoid(16),
            message: newMessage.text,
            fromMe: true,
            timestamp: Date.now(),
            status: "pending",
            chatId: user?.localChatId,

            // media: [
            //   {
            //     source: "/path/to/file.jpg",
            //     publicId: "img123",
            //   },
            // ],
        });

        setMessages((prev) => [...prev, newMessage]);
        setInput("");

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
    };

    const openAttachmentModal = () => {
        setAttachmentModalVisible(true);
        Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    };

    const closeAttachmentModal = () => {
        Animated.timing(slideAnim, {
            toValue: 300,
            duration: 250,
            useNativeDriver: true,
        }).start(() => setAttachmentModalVisible(false));
    };

    const handleGallery = async () => {
        closeAttachmentModal();

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "Gallery permission is required to select photos");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"], // <-- use string
            allowsEditing: true,
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            Alert.alert("Success", `${result.assets.length} image(s) selected!`);
        }
    };

    const handleVideo = async () => {
        closeAttachmentModal();

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "Gallery permission is required to select videos");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["videos"], // <-- use string
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            Alert.alert("Success", "Video selected!");
        }
    };


    const handleAudio = async () => {
        closeAttachmentModal();
        const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
        if (!result.canceled) Alert.alert("Success", "Audio file selected!");
    };

    const handleDocument = async () => {
        closeAttachmentModal();

        try {
            const result: any = await DocumentPicker.getDocumentAsync({ type: "*/*" });

            if (result?.uri) {
                Alert.alert("Success", `Document selected: ${result.name}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to select document");
        }
    };



    const handleLocation = () => {
        closeAttachmentModal();
        Alert.alert("Location Sharing", "Location sharing will be implemented");
    };

    const attachmentOptions: AttachmentOption[] = [
        { id: "1", title: "Gallery", icon: "images", color: "#8B5CF6", action: handleGallery },
        { id: "2", title: "Video", icon: "videocam", color: "#10B981", action: handleVideo },
        { id: "3", title: "Audio", icon: "musical-notes", color: "#F59E0B", action: handleAudio },
        { id: "4", title: "Document", icon: "document-text", color: "#3B82F6", action: handleDocument },
    ];

    const renderItem = ({ item }: { item: Message }) => (
        <View
            className={`my-1 px-3 py-2 max-w-[70%] rounded-lg ${item.sender === "me" ? "bg-blue-600 self-end" : "bg-gray-800 self-start"
                }`}
        >
            <Text className={`${item.sender === "me" ? "text-white" : "text-gray-100"}`}>
                {item.text}
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-black">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                {/* Header */}
                <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
                    <TouchableOpacity className="mr-3" onPress={() => {
                        clearCurrentChat();
                        router.back();
                    }}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center mr-3">
                        <Ionicons name="person" size={20} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-white font-semibold text-base">{user?.name}</Text>
                        <Text className="text-gray-400 text-xs">Online</Text>
                    </View>
                    <TouchableOpacity className="p-2">
                        <Ionicons name="videocam" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 ml-2">
                        <Ionicons name="call" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 10 }}
                />

                {/* Input Box */}
                <View className="flex-row items-center border-t border-gray-700 p-2 bg-black">
                    <TouchableOpacity onPress={openAttachmentModal} className="px-2 py-2">
                        <Ionicons name="attach" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 border border-gray-700 rounded-full px-4 py-2 mr-2 text-white bg-gray-900"
                        placeholder="Type a message"
                        placeholderTextColor="#6B7280"
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={1000}
                    />

                    <TouchableOpacity
                        onPress={sendMessage}
                        className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center"
                    >
                        <Ionicons name="send" size={18} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Attachment Options Modal */}
                <Modal
                    visible={attachmentModalVisible}
                    transparent
                    animationType="none"
                    onRequestClose={closeAttachmentModal}
                >
                    <Pressable className="flex-1 bg-black/50" onPress={closeAttachmentModal}>
                        <Animated.View
                            style={{ transform: [{ translateY: slideAnim }] }}
                            className="absolute bottom-16 left-0 right-0 bg-gray-900 rounded-t-3xl p-4"
                        >
                            <View className="w-12 h-1 bg-gray-600 rounded-full self-center mb-4" />
                            <Text className="text-white text-lg text-center font-semibold mb-4 px-2">
                                Share Content
                            </Text>

                            <View className="flex-row flex-wrap justify-around pb-4">
                                {attachmentOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.id}
                                        onPress={option.action}
                                        className="items-center mb-4 w-20"
                                    >
                                        <View
                                            style={{ backgroundColor: option.color }}
                                            className="w-14 h-14 rounded-full items-center justify-center mb-2"
                                        >
                                            <Ionicons name={option.icon} size={26} color="white" />
                                        </View>
                                        <Text className="text-white text-xs text-center">{option.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    </Pressable>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
