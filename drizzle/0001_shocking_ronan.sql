ALTER TABLE `chats` ADD `user1_id` integer NOT NULL REFERENCES contacts(id);--> statement-breakpoint
ALTER TABLE `chats` ADD `user2_id` integer NOT NULL REFERENCES contacts(id);