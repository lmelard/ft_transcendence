import { User } from "./User";

export interface GameMdl {
    id: string;
    players: User[];
    scoreR: number;
    scoreL: number;
    error: string;
    mode: string;
    status: string;
    winnerId: string;
    type: string;
    owner: User;
  }
