import { GroupModel } from './group-model';
import { UserModel } from './user-model';

export type GroupMemberRole = 'ADMIN' | 'MEMBER';

export interface GroupMemberModel {
  id: number | null;
  group: GroupModel | null;
  member: UserModel | null;
  role: GroupMemberRole;
  joinedAt?: string | null;
}

export interface GroupMemberDTO {
  id?: number | null;
  group: GroupModel | null;
  member: UserModel | null;
  role: GroupMemberRole;
}
