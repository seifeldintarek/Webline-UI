import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient,
    private authService: AuthService
  ) { }

  setImage(image: string) {
    const userId = this.authService.getId();
    return this.http.post<string>(`/api/users/user/${userId}/image`, image, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }

  updateUser(newUser: UserModel) {
    if (!newUser) return;
    const userId = this.authService.getId();
    return this.http.patch<UserModel>(`/api/users/user/${userId}`, newUser, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }
}
