CREATE TABLE `chat_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contact_public_id` text NOT NULL,
	`chat_id` integer NOT NULL,
	`contact_id` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`public_chat_id` text,
	`is_group` integer NOT NULL,
	`image_url` text,
	`last_updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`public_id` text NOT NULL,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `media_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`public_id` text NOT NULL,
	`message_id` integer NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text NOT NULL,
	`msg_pub_id` text,
	`message` text NOT NULL,
	`from_me` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`status` text NOT NULL,
	`chat_id` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
