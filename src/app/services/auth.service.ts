import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = "http://localhost:3000/api/users/auth/";

  constructor(private http: HttpClient) { }

  private currentUser: UserModel | null = null;

  initUserFromToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.decodeToken(token);
    }
  }

  assignToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  getToken() {
    return localStorage.getItem('access_token');
  }
  signup(user: UserModel) {
    return this.http.post<UserModel>(this.authUrl + 'signup', user);
  }
  login(email: string, password: string) {
    const user: UserModel = {
      email,
      password,
      firstName: '',
      lastName: '',
      image: '',
      mobilePhone: '',
      id: null
    };

    return this.http.post<{ access_token: string }>(this.authUrl + 'login', user)
  }



  private decodeToken(token: string) {
    const url = "http://localhost:3000/api/users/user/info";
    this.http.get<UserModel>(url, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => console.log('Error fetching user info:', error)
    });
  }

  loadTokenFromStorage() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.decodeToken(token);
    }
  }
  logout() {
    this.currentUser = null;
    localStorage.removeItem('access_token');
  }

  getId() { return this.currentUser?.id; }
  getFullName() { return this.currentUser?.fullName; }
  getEmail() { return this.currentUser?.email; }

  getUser() { return this.currentUser; }


}
