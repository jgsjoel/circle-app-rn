import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../local_db/db";
import { contacts as contactsTable } from "../../local_db/schema";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMessagingStore } from "@/src/store/messageing_store";
import { createChat } from "@/src/services/messaging_service";

interface ContactItem {
    id: number;
    name: string;
    phone: string;
    publicId:string;
}

export default function ContactScreen() {
    const [contacts, setContacts] = useState<ContactItem[]>([]);
    const [loading, setLoading] = useState(true);
    const setUser = useMessagingStore((state) => state.setUser);
    const navigation = useNavigation();

    const fetchContacts = async () => {
        try {
            const data = await db.select().from(contactsTable).all();
            const formatted: ContactItem[] = data.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                publicId:c.publicId
            }));
            setContacts(formatted);
        } catch (error) {
            console.error("Failed to fetch contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const renderItem = ({ item }: { item: ContactItem }) => {
    
        return (
            <TouchableOpacity
                className="px-4 py-3"
                onPress={async() => {
                    
                    const chatId = await createChat(item.name,item.publicId);
                    setUser({
                        id: item.id,
                        name: item.name,
                        phone: item.phone,
                        publicId: item.publicId,
                        localChatId: chatId
                    });
    
                    // Navigate to messaging screen
                    router.push("/protected/messaging_screeen");
                }}
            >
                <Text className="text-white text-base font-semibold">{item.name}</Text>
                <Text className="text-gray-400 text-sm mt-1">{item.phone}</Text>
            </TouchableOpacity>
        );
    };
    

    return (
        <SafeAreaView className="flex-1 bg-black">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold ml-4">My Contacts</Text>
            </View>

            {loading ? (
                <Text className="text-center mt-5 text-white">Loading contacts...</Text>
            ) : contacts.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-400 text-base">No contacts found</Text>
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View className="h-px bg-gray-700 mx-4" />}
                />
            )}
        </SafeAreaView>
    );
}
