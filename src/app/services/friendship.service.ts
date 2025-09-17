import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class FriendshipService {

  private apiUrl = "http://localhost:3000/api/users";
  private friends: UserModel[] = [];

  constructor(private http: HttpClient,
    private authService: AuthService
  ) { }

  getUserFriends() {
    const userId = this.authService.getId();
    this.http.get<UserModel[]>(`${this.apiUrl}/${userId}/friends`).subscribe({
      next: (response) => {
        this.friends = response;
      },
      error: (error) => {
        console.error('Error fetching friends:', error);
      }
    });
    return this.friends;
  }
}
