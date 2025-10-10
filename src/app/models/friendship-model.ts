export interface FriendshipModel {
    id: number | null;
    senderId: number | null;
    receiverId: number | null;
    status: 'PENDING' | 'FRIENDS' | null;
    createdAt: Date | null;
    updatedAt: Date | null;
}
