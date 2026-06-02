import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserModel } from '../models/user-model';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authUrl = `${environment.userServiceUrl}/auth/`;

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
    const url = `${environment.userServiceUrl}/user/info`;
    this.http.get<UserModel>(url, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => alert('Error fetching user info:' + error)
    });
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) return of(false);

    return this.http.get<UserModel>(
      `${environment.userServiceUrl}/user/info`,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      map(user => {
        this.currentUser = user;
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
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

  getUser(): UserModel { return this.currentUser!; }

  setCurrentUser(newUser: UserModel) {
    this.currentUser = { ...newUser };
  }

}
