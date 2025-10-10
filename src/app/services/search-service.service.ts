import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserModel } from '../models/user-model';
import { PageResponse } from '../models/page-response';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private http: HttpClient,
    private authService: AuthService
  ) { }

  private readonly searchUrl = "http://localhost:3000/api/users/user/search?page=";

  private pageSize = "&size=10";
  private sortBy = "&sort=id,asc";

  searchUsers(query: string, page: number) {

    const currentPage = page - 1;
    const queryTrimmed = query.trim();
    const url = this.searchUrl.concat(currentPage + this.pageSize + this.sortBy + "&");

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
    return this.http.get<PageResponse<UserModel>>(url + 'name=' + name, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
  }

  private searchWithEmail(email: string, url: string) {
    const validEmail = new FormControl(email, [Validators.required, Validators.email]);
    if (validEmail.valid) {
      return this.http.get<PageResponse<UserModel>>(url + 'email=' + email, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
    }
    return null;
  }
  private searchWithPhone(phone: string, url: string) {
    if (phone.length <= 11) {
      return this.http.get<PageResponse<UserModel>>(url + 'number=' + phone, { headers: { Authorization: `Bearer ${this.authService.getToken()}` } });
    }
    return null;
  }
}
