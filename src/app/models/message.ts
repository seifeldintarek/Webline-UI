import { AttachmentDto } from "./attachment-dto";

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  VOICE_NOTE = 'VOICE_NOTE',
}

export interface Message {
  id?: string;
  content: string;
  senderId: number;
  conversationId: string;
  contentType: MessageType;
  timestamp: Date | string;
  readBy?: number[];
  receivedBy?: number[];
  attachment: AttachmentDto | null;
}


