import { User } from "@prisma/client";

export interface MessageResponse {
	id: number;
	createAt: Date;
	text: string;
	author: string;
	channelName: string;
	avatar: string;
}

export interface ChatResponse {
	ok: boolean;
	status?: number;
	statusText: string;
}

export interface ChannelDM {
    id: string;
    name: string;
    ownerId: string;
    owner: User;  
    type: string;
    label: string;
}