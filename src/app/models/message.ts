import { AttachmentDto } from "./attachment-dto";

export interface Message {
  id?: string;
  content: string;
  senderId: number;
  conversationId: string;
  contentType: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE_NOTE';
  timestamp: Date | string;
  readBy?: number[];
  receivedBy?: number[];
  attachment: AttachmentDto | null;
}
