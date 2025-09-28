import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserModel } from '../models/user-model';
import { FriendshipModel } from '../models/friendship-model';
import { PageResponse } from '../models/page-response';
import { ConversationDTO, ConversationType } from '../models/conversation-model';

@Injectable({
  providedIn: 'root'
})
export class FriendshipService {

  private apiUrl = "http://localhost:3000/api/users";
  private convUrl = 'http://localhost:3000/api/messages/conversation';
  private pageParam = "&size=10&sort=id,asc";
  private friends: UserModel[] = [];

  constructor(private http: HttpClient,
    private authService: AuthService
  ) { }

  getUserFriends(page: number = 1) {
    const currentPage = page - 1;
    const userId = this.authService.getId();
    return this.http.get<PageResponse<UserModel>>(`${this.apiUrl}/${userId}/friends?page=${currentPage}&${this.pageParam}`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }

  getMyFriendRequests(page: number = 1) {
    const currentPage = page - 1;
    const userId = this.authService.getId();
    return this.http.get<PageResponse<UserModel>>(`${this.apiUrl}/${userId}/requests/all?page=${currentPage}&${this.pageParam}`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }

  getFriendRequests(page: number = 1) {
    const currentPage = page - 1;
    const userId = this.authService.getId();
    return this.http.get<PageResponse<UserModel>>(`${this.apiUrl}/${userId}/requests/received?page=${currentPage}&${this.pageParam}`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }

  pushFriend(friend: UserModel) {
    this.friends.push(friend);
  }

  addFriend(addedFriend: UserModel) {
    const userId = this.authService.getId();
    const friendship: FriendshipModel = {
      id: null,
      senderId: this.authService.getId()!,
      receiverId: addedFriend.id!,
      status: null,
      createdAt: null,
      updatedAt: null
    };
    this.http.post<UserModel>(this.apiUrl + "/addFriend", friendship, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }).subscribe({
      next: (friend) => {
        this.friends.push(friend);
      },
      error: (error) => {
        console.error('Error adding friend:', error);
      }
    });
  }
  removeRequest(friendship: FriendshipModel) {
    return this.http.delete(`${this.apiUrl}/deleteFriendship`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` }, body: friendship })
  }
  acceptRequest(friendship: FriendshipModel) {
    return this.http.post<FriendshipModel>(`${this.apiUrl}/acceptFriend`, friendship, { headers: { Authorization: `Bearer ${this.authService.getToken()!}` } })
  }

  createConversation(uid: number) {
    const currentId = this.authService.getId();
    const conversation: ConversationDTO = {
      id: null,
      participants: [currentId!, uid],
      type: ConversationType.PRIVATE,
      createdAt: null,
      updatedAt: null,
      groupId: null,
      isBlocked: { currentId: false },
      lastModifiedBy: null,
      name: null
    }
    return this.http.post(this.convUrl, conversation, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } })
  }

  getConverstaion(uids: number[], type: ConversationType) {
    const currentId = this.authService.getId();
    uids.push(currentId!);
    return this.http.get<ConversationDTO>(`${this.convUrl}?participant_ids=${uids}&conversation_type=${type}`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }
}
