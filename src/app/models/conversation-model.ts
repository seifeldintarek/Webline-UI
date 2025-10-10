
export enum ConversationType {
    PRIVATE = 'PRIVATE',
    GROUP = 'GROUP'
}

export interface ConversationDTO {
    id: string | null;
    type: ConversationType;
    groupId?: number | null;
    name?: string | null;
    participants: number[];
    isBlocked?: { [userId: string]: boolean };
    createdAt?: string | null;
    updatedAt?: string | null;
    lastModifiedBy?: number | null;
}

