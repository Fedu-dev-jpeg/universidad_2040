CREATE TABLE `contact_interests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`studentName` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_interests_id` PRIMARY KEY(`id`)
);
