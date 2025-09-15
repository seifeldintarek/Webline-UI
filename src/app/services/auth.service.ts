import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = "http://localhost:3000/api/users/auth/";

  constructor(private http: HttpClient) { }

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
    return this.http.post(this.authUrl + 'login', user);
  }
}
