import { db } from "../local_db/db";
import { chatParticipants, chats, contacts, messages } from "../local_db/schema";
import { useAuthStore } from "../store/auth_store";
import { useMessagingStore } from "../store/messageing_store";
import { eq, and, or, inArray, sql } from "drizzle-orm";

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


export async function getChatsWithMessages() {
  // 1. Get all chatIds that have messages
  const messageChatIds = await db
    .select({ chatId: messages.chatId })
    .from(messages)
    .groupBy(messages.chatId)
    .all(); // <-- execute query

  const chatIds = messageChatIds.map((m) => m.chatId);

  if (chatIds.length === 0) return []; // no chats with messages

  // 2. Select chats whose id is in chatIds
  const chatsWithMessages = await db
    .select()
    .from(chats)
    .where(inArray(chats.id, chatIds))
    .all(); // <-- execute query

  return chatsWithMessages;
}