import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private http: HttpClient) { }

  private searchUrl = "http://localhost:3000/api/users/user/search?";

  searchUsers(query: string) {

    const queryTrimmed = query.trim();

    if (queryTrimmed.includes('@')) {
      return this.searchWithEmail(queryTrimmed);
    }
    else if (!isNaN(Number(queryTrimmed)) && queryTrimmed !== "") {
      return this.searchWithPhone(queryTrimmed);
    }
    else {
      return this.searchWithName(queryTrimmed);
    }
  }

  private searchWithName(name: string) {
    return this.http.get<UserModel[]>(this.searchUrl + 'name=' + name);
  }

  private searchWithEmail(email: string) {
    const validEmail = new FormControl(email, [Validators.required, Validators.email]);
    if (validEmail.valid) {
      return this.http.get<UserModel[]>(this.searchUrl + 'email=' + email);
    }
    return null;
  }
  private searchWithPhone(phone: string) {
    if (phone.length <= 11) {
      return this.http.get<UserModel[]>(this.searchUrl + 'number=' + phone);
    }
    return null;
  }
}
