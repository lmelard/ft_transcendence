import { UserDetails } from "./UserDetails";

export interface Channel {
    id: string;
    name: string;
    ownerId: string;
    owner?:UserDetails;  
    type: string;
    label: string;
  }
