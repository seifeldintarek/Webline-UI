import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

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
}
