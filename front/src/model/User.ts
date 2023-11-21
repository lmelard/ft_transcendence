//TO DO CLEAN USER

import { GameMdl } from "./GameMdl";

export interface User {
    id: string;
    nickname: string;
    email: string;
    fullName: string;
    imageUrl?: string;
    online:   boolean;
    isPlaying: boolean;
    playerOf: GameMdl[];
  }
