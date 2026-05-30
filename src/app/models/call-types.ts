
export interface IncomingCallPayload {
  roomId: string;
  callerId: number;
  callerName: string;
  callerAvatar?: string;
  conversationId: string;
  callType: 'PRIVATE' | 'GROUP';
  groupId?: number;
}

export interface CallDeclinePayload {
  roomId: string;
  declinedBy: number;
  callerId: number;
}
