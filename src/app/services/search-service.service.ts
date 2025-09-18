import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserModel } from '../models/user-model';
import { PageResponse } from '../models/page-response';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private http: HttpClient) { }

  private readonly searchUrl = "http://localhost:3000/api/users/user/search?page=";

  searchUsers(query: string, page: number) {

    const queryTrimmed = query.trim();
    const url = this.searchUrl.concat(page + "&");

    if (queryTrimmed.includes('@')) {
      return this.searchWithEmail(queryTrimmed, url);
    }
    else if (!isNaN(Number(queryTrimmed)) && queryTrimmed !== "") {
      return this.searchWithPhone(queryTrimmed, url);
    }
    else {
      return this.searchWithName(queryTrimmed, url);
    }
  }

  private searchWithName(name: string, url: string) {
    return this.http.get<PageResponse<UserModel>>(url + 'name=' + name);
  }

  private searchWithEmail(email: string, url: string) {
    const validEmail = new FormControl(email, [Validators.required, Validators.email]);
    if (validEmail.valid) {
      return this.http.get<PageResponse<UserModel>>(url + 'email=' + email);
    }
    return null;
  }
  private searchWithPhone(phone: string, url: string) {
    if (phone.length <= 11) {
      return this.http.get<PageResponse<UserModel>>(url + 'number=' + phone);
    }
    return null;
  }
}
