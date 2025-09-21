import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserModel } from '../models/user-model';
import { FriendshipModel } from '../models/friendship-model';
import { PageResponse } from '../models/page-response';

@Injectable({
  providedIn: 'root'
})
export class FriendshipService {

  private apiUrl = "http://localhost:3000/api/users";
  private friends: UserModel[] = [];
  private friendRequests: UserModel[] = [];

  constructor(private http: HttpClient,
    private authService: AuthService
  ) { }

  getUserFriends(page: number = 1) {
    const userId = this.authService.getId();
    return this.http.get<PageResponse<UserModel>>(`${this.apiUrl}/${userId}/friends?page=${page}`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }

  getMyFriendRequests(page: number = 1) {
    const userId = this.authService.getId();
    return this.http.get<PageResponse<UserModel>>(`${this.apiUrl}/${userId}/requests/all?page=${page}`, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
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
}
