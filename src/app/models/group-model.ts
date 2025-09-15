import { User } from "../user/user.component";

export interface GroupModel {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date | null;
    createdBy: User | null;
}

