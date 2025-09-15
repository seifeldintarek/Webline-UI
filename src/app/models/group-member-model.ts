import { Group } from "../group/group.component";
import { User } from "../user/user.component";

export interface GroupMemberModel {
    id: number;
    groupId: Group;
    member: User;
    role: 'MEMBER' | 'ADMIN';
    joinedAt: Date;
    updatedAt: Date;
}
