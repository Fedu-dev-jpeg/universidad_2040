CREATE TABLE `capsule_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`interaction1` varchar(255),
	`interaction2` json,
	`interaction3` varchar(255),
	`interaction4Opinion` varchar(50),
	`interaction4Text` text,
	`interaction5` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `capsule_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capsule_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`studentName` varchar(255),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `capsule_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `capsule_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
