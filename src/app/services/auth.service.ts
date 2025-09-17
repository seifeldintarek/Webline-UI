import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = "http://localhost:3000/api/users/auth/";

  constructor(private http: HttpClient) { }

  private currentUserToken: string | null = null;
  private id: number | null = null;
  private email: string | null = null;
  private fullName: string | null = null;

  assignToken(token: string) {
    this.currentUserToken = token;
    localStorage.setItem('access_token', token);
    this.decodeToken(token);
  }
  signup(user: UserModel) {
    return this.http.post(this.authUrl + 'signup', user);
  }
  login(email: string, password: string) {
    const user: UserModel = {
      email: email,
      password: password,
      firstName: '',
      lastName: '',
      image: '',
      mobilePhone: '',
      id: null
    };
    return this.http.post(this.authUrl + 'login', user)
  }


  private decodeToken(token: string) {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    this.id = Number(decoded.sub);
    this.email = decoded.email;
    this.fullName = decoded.fullName;
  }

  loadTokenFromStorage() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.currentUserToken = token;
      this.decodeToken(token);
    }
  }
  logout() {
    this.currentUserToken = null;
    this.id = null;
    this.email = null;
    this.fullName = null;
    localStorage.removeItem('access_token');
  }

  getId() { return this.id; }
  getFullName() { return this.fullName; }
  getEmail() { return this.email; }


}
