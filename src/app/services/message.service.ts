import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { Message } from '../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(private authService: AuthService,
    private http: HttpClient
  ) { }

  getMessages(conversationId: string) {
    return this.http.get<Message[]>(`http://localhost:5600/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

  uploadImage(file: File, conversationId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    return this.http.post<any>(`http://localhost:5600/api/messages/upload`, formData, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

  deleteMessages(conversationId: string) {
    return this.http.delete<void>(`http://localhost:5600/api/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

  deleteConversation(conversationId: string) {
    return this.http.delete<void>(`http://localhost:5600/api/conversation/${conversationId}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    });
  }

}
