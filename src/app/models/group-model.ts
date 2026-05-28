import { UserModel } from "./user-model";

export interface GroupModel {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  createdBy: UserModel | null;
}

