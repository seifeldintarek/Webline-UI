export interface Message {
    id?: string;
    content: string;
    senderId: number;
    conversationId: string;
    contentType: string;
    timestamp: Date | string;
    readBy?: number[];
    receivedBy?: number[];
}