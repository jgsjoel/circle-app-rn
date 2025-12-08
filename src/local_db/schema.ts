import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Chats
export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  publicChatId: text("public_chat_id"),
  imageUrl: text("image_url"),
  isGroup: integer("is_group", { mode: "boolean" }).notNull(),
  lastMessage: text("last_message"),       // <-- add this
  lastTimestamp: integer("last_timestamp") // <-- add this
});

// Messages
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  messageId: text("message_id").notNull(),
  msgPubId: text("msg_pub_id"),
  message: text("message").notNull(),
  fromMe: integer("from_me", { mode: "boolean" }).notNull(),
  timestamp: integer("timestamp").notNull(),
  status: text("status").notNull(),
  chatId: integer("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
});

// Chat participants
export const chatParticipants = sqliteTable("chat_participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contactPublicId: text("contact_public_id").notNull(),
  chatId: integer("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
});

// Media files
export const mediaFiles = sqliteTable("media_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  publicId: text("public_id").notNull(),
  messageId: integer("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
});

// Contacts (independent)
export const contacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  publicId: text("public_id").notNull(), 
  imageUrl: text("image_url"),
});
