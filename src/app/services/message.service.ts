import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Message, MessageType } from '../models/message';
import { AttachmentDto } from '../models/attachment-dto';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  getConversation(targetId: any, callType: string) {
    throw new Error('Method not implemented.');
  }

  constructor(private authService: AuthService,
    private http: HttpClient
  ) { }

  getMessages(conversationId: string) {
    return this.http.get<Message[]>(`${environment.messageServiceUrl}/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

  uploadFile(file: File, conversationId: string, type: MessageType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    formData.append('type', type);
    return this.http.post<AttachmentDto>(`${environment.messageServiceUrl}/messages/upload`, formData, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

  deleteMessages(conversationId: string) {
    return this.http.delete<void>(`${environment.messageServiceUrl}/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

  deleteConversation(conversationId: string) {
    return this.http.delete<void>(`${environment.messageServiceUrl}/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

}
