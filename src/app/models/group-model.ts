import { User } from "../user/user.component";

export interface GroupModel {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  createdBy: User | null;
}

