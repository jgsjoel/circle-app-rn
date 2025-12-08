import { db } from "../local_db/db";
import { chatParticipants, chats, contacts, mediaFiles, messages } from "../local_db/schema";
import { useAuthStore } from "../store/auth_store";
import { useMessagingStore } from "../store/messageing_store";
import { eq, and, or, inArray, sql } from "drizzle-orm";
import { formatChatTime } from "../utils/time_format";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

interface SaveMessageParams {
  messageId: string;
  msgPubId?: string;
  message: string;
  fromMe: boolean;
  timestamp: number;
  status: string;
  chatId: number;

  media?: {
    source: string;
    publicId: string;
  }[];
}


export async function findExistingChat(userA: string, userB: string) {
  const result = await db
    .select({
      chatId: chatParticipants.chatId,
    })
    .from(chatParticipants)
    .where(
      inArray(chatParticipants.contactPublicId, [userA, userB])
    )
    .groupBy(chatParticipants.chatId)
    .having(sql`COUNT(*) = 2`);

  return result.length > 0 ? result[0].chatId : null;
}

export async function createChat(userName: string, userId: string) {
  const currentUserId = useAuthStore.getState().userId;
  const existing = await findExistingChat(currentUserId!, userId);
  getChatWithParticipants(existing!);
  if (existing) return existing;

  // 1. create chat
  const [chat] = await db.insert(chats).values({
    name: userName,
    isGroup: false,
  }).returning({ id: chats.id });

  // 2. add chat participants
  await db.insert(chatParticipants).values([
    { contactPublicId: currentUserId!, chatId: chat.id },
    { contactPublicId: userId, chatId: chat.id },
  ]);

  return chat.id;
}

async function getChatWithParticipants(chatId: number) {
  const chat = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId));

  const participants = await db
    .select()
    .from(chatParticipants)
    .where(eq(chatParticipants.chatId, chatId));

  return { chat: chat[0], participants };
}


export async function saveMessage(data: SaveMessageParams) {
  // 1. Insert the message
  const inserted = await db
    .insert(messages)
    .values({
      messageId: data.messageId,
      msgPubId: data.msgPubId ?? null,
      message: data.message,
      fromMe: data.fromMe,
      timestamp: data.timestamp,
      status: data.status,
      chatId: data.chatId,
    })
    .returning()
    .get();

  // 2. Insert any media files
  if (data.media && data.media.length > 0) {
    for (const m of data.media) {
      await db.insert(mediaFiles).values({
        source: m.source,
        publicId: m.publicId,
        messageId: inserted.id, // link to message
      });
    }
  }

  // 3. Update the chats table with the last message and timestamp
  await db
    .update(chats)
    .set({
      lastMessage: data.message,
      lastTimestamp: data.timestamp,
    })
    .where(eq(chats.id, data.chatId))
    .run();

  console.log("Saved message and updated chat:", inserted);

  return inserted;
}


export async function getMessagesWithMedia(chatId: number) {
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.timestamp)
    .all();

  // load media per message
  const msgsWithMedia = [];
  for (const msg of msgs) {
    const media = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.messageId, msg.id))
      .all();

    msgsWithMedia.push({
      ...msg,
      media,
    });
  }

  return msgsWithMedia;
}




export async function deleteChat(chatId: number) {
  // 1. Delete associated media first
  const chatMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .all();

  for (const msg of chatMessages) {
    await db.delete(mediaFiles).where(eq(mediaFiles.messageId, msg.id)).run();
  }

  // 2. Delete messages
  await db.delete(messages).where(eq(messages.chatId, chatId)).run();

  // 3. Delete chat participants
  await db.delete(chatParticipants).where(eq(chatParticipants.chatId, chatId)).run();

  // 4. Delete the chat itself
  await db.delete(chats).where(eq(chats.id, chatId)).run();

  console.log(`Deleted chat ${chatId} and all associated messages`);
}