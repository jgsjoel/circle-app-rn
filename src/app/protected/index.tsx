import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, desc, not, isNotNull } from 'drizzle-orm';
import { chats, messages } from '@/src/local_db/schema';
import { db } from '@/src/local_db/db';
import { formatChatTime } from '@/src/utils/time_format';
import { useMessagingStore } from '@/src/store/messageing_store';

// Types
type Tab = 'chats' | 'calls';

// Menu items
const menuItems = [
  { id: '1', title: 'New Group', icon: 'people-outline' },
  { id: '2', title: 'New Broadcast', icon: 'megaphone-outline' },
  { id: '3', title: 'Linked Devices', icon: 'link-outline' },
  { id: '4', title: 'Starred Messages', icon: 'star-outline' },
  { id: '5', title: 'Settings', icon: 'settings-outline' },
];

// Sample calls
const sampleCalls = [
  { id: '1', name: 'John Doe', type: 'incoming', time: '10:30 AM', missed: false, avatar: null },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [showMenu, setShowMenu] = useState(false);
  const setUser = useMessagingStore((state) => state.setUser);

  // Live query: fetch chats with at least one message, including last message and unread count
  const chatsWithMessages = useLiveQuery(
    db
      .select({
        id: chats.id,
        name: chats.name,
        imageUrl: chats.imageUrl,
        lastMessage: chats.lastMessage,
        timestamp: chats.lastTimestamp,
      })
      .from(chats)
      .where(isNotNull(chats.lastMessage)) // only chats with a lastMessage
      .orderBy(desc(chats.lastTimestamp))
  );

  console.log('Chats with Messages:', chatsWithMessages); 

  const renderChatItem = ({ item }: any) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-800"
      onPress={() =>{
        setUser({
          id: item.id,
          name: item.name,
          phone: item.phone,
          publicId: item.publicId,
          localChatId: item.id
      });
        router.push(`/protected/messaging_screeen?chatId=${item.id}`);
      }}
    >
      <View className="w-14 h-14 rounded-full bg-gray-700 items-center justify-center mr-3">
        {item.avatar ? <Image source={{ uri: item.avatar }} className="w-14 h-14 rounded-full" /> : <Ionicons name="person" size={24} color="#9CA3AF" />}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-white font-semibold text-base">{item.name}</Text>
          <Text className="text-gray-400 text-xs">{formatChatTime(item.timestamp)}</Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-400 text-sm flex-1" numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View className="w-5 h-5 rounded-full bg-indigo-500 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCallItem = ({ item }: any) => (
    <TouchableOpacity className="flex-row items-center px-4 py-3 border-b border-gray-800">
      <View className="w-14 h-14 rounded-full bg-gray-700 items-center justify-center mr-3">
        {item.avatar ? <Image source={{ uri: item.avatar }} className="w-14 h-14 rounded-full" /> : <Ionicons name="person" size={24} color="#9CA3AF" />}
      </View>

      <View className="flex-1">
        <Text className={`font-semibold text-base mb-1 ${item.missed ? 'text-red-500' : 'text-white'}`}>{item.name}</Text>
        <View className="flex-row items-center">
          <Ionicons name={item.type === 'incoming' ? 'arrow-down' : 'arrow-up'} size={14} color={item.missed ? '#EF4444' : '#9CA3AF'} />
          <Text className="text-gray-400 text-sm ml-1">{item.time}</Text>
        </View>
      </View>

      <TouchableOpacity className="p-2" onPress={() => router.push('/protected/video_call_screen')}>
        <Ionicons name="call" size={24} color="#10B981" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1">
        {/* Header */}
        <View className="pt-12 pb-4 px-4 bg-black border-b border-gray-800">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-2xl font-bold">Circle</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity>
                <Ionicons name="search" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMenu(true)}>
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row">
            <TouchableOpacity className={`flex-1 pb-3 ${activeTab === 'chats' ? 'border-b-2 border-indigo-500' : ''}`} onPress={() => setActiveTab('chats')}>
              <Text className={`text-center font-semibold text-base ${activeTab === 'chats' ? 'text-indigo-500' : 'text-gray-400'}`}>Chats</Text>
            </TouchableOpacity>
            <TouchableOpacity className={`flex-1 pb-3 ${activeTab === 'calls' ? 'border-b-2 border-indigo-500' : ''}`} onPress={() => setActiveTab('calls')}>
              <Text className={`text-center font-semibold text-base ${activeTab === 'calls' ? 'text-indigo-500' : 'text-gray-400'}`}>Calls</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {activeTab === 'chats' ? (
          <FlatList data={chatsWithMessages?.data || []} renderItem={renderChatItem} keyExtractor={(item) => item.id.toString()} className="flex-1" />
        ) : (
          <FlatList data={sampleCalls} renderItem={renderCallItem} keyExtractor={(item) => item.id} className="flex-1" />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-500 items-center justify-center shadow-lg"
          onPress={() => router.push('/protected/contacts_screen')}
        >
          <Ionicons name={activeTab === 'chats' ? 'chatbubble' : 'call'} size={24} color="white" />
        </TouchableOpacity>

        {/* Dropdown Menu Modal */}
        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View className="flex-1 bg-black/50">
              <View className="absolute top-16 right-4 bg-gray-900 rounded-lg overflow-hidden min-w-[200px] shadow-xl">
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    className={`flex-row items-center px-4 py-3 ${index !== menuItems.length - 1 ? 'border-b border-gray-800' : ''}`}
                    onPress={() => {
                      setShowMenu(false);
                      console.log(`Selected: ${item.title}`);
                    }}
                  >
                    <Ionicons name={item.icon as any} size={20} color="#9CA3AF" />
                    <Text className="text-white text-base ml-3">{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
