import { db } from "../local_db/db";
import { chatParticipants, chats } from "../local_db/schema";
import { useAuthStore } from "../store/auth_store";
import { useMessagingStore } from "../store/messageing_store";
import { eq, and, or } from "drizzle-orm";

export const getOrCreateChatParticipants = async (): Promise<number | null> => {
  const currentUserId = useAuthStore.getState().userId;
  const selectedContact = useMessagingStore.getState().user;
 
  console.log(currentUserId);
  console.log(selectedContact);

  if (!currentUserId || !selectedContact) {
    console.error("Missing current user or selected contact");
    return null;
  }

  try {
    // 1️⃣ Check if a chat already exists between these two users
    const existingChat = await db
      .select()
      .from(chats)
      .where(
        or(
          and(eq(chats.user1Id, currentUserId), eq(chats.user2Id, selectedContact.id)),
          and(eq(chats.user1Id, selectedContact.id), eq(chats.user2Id, currentUserId))
        )
      )
      .get();

    let chatId: number;

    if (existingChat) {
      chatId = existingChat.id;
    } else {
      // 2️⃣ Create a new chat
      const insertedChat = await db.insert(chats).values({
        name: `${currentUserId}-${selectedContact.id}`,
        isGroup: false, // <-- use boolean
        lastUpdated: Date.now(),
        user1Id: currentUserId,
        user2Id: selectedContact.id,
      }).returning();

      chatId = insertedChat[0].id;
    }

    // 3️⃣ Ensure both participants exist in chatParticipants
    const existingParticipants = await db
      .select()
      .from(chatParticipants)
      .where(eq(chatParticipants.chatId, chatId));

    const participantIds = existingParticipants.map(p => p.contactId);

    const valuesToInsert = [];

    if (!participantIds.includes(currentUserId)) {
      valuesToInsert.push({
        chatId,
        contactId: currentUserId,
        contactPublicId: "", // optional
      });
    }

    if (!participantIds.includes(selectedContact.id)) {
      valuesToInsert.push({
        chatId,
        contactId: selectedContact.id,
        contactPublicId: selectedContact.publicId,
      });
    }

    if (valuesToInsert.length > 0) {
      await db.insert(chatParticipants).values(valuesToInsert);
    }
    getAllChatsWithParticipants();
    return chatId;
  } catch (err) {
    console.error("Failed to get or create chat participants:", err);
    return null;
  }
};


export const getAllChatsWithParticipants = async () => {
  try {
    const result = await db
      .select({
        chatId: chats.id,
        chatName: chats.name,
        isGroup: chats.isGroup,
        lastUpdated: chats.lastUpdated,
        participantId: chatParticipants.contactId,
        participantPublicId: chatParticipants.contactPublicId,
      })
      .from(chats)
      .leftJoin(chatParticipants, eq(chatParticipants.chatId, chats.id));

      console.log(result);
    return result;
  } catch (err) {
    console.error("Failed to fetch chats with participants:", err);
    return [];
  }
};