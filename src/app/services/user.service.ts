import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5500/api/users/user';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  setImage(image: string) {
    const userId = this.authService.getId();

    return this.http.post(
      `${this.apiUrl}/${userId}/image`,
      image,
      {
        headers: {
          Authorization: `Bearer ${this.authService.getToken()}`
        },
        responseType: 'text'
      }
    );
  }

  updateUser(newUser: UserModel) {
    const userId = this.authService.getId();
    return this.http.patch<UserModel>(
      `${this.apiUrl}/${userId}`,
      newUser,
      { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
    );
  }

  getUserById(userId: number) {
    return this.http.get<UserModel>(
      `${this.apiUrl}/${userId}`,
      { headers: { Authorization: `Bearer ${this.authService.getToken()}` } }
    );
  }
}
