import { Component } from '@angular/core';
import { SearchService } from '../services/search-service.service';
import { UserModel } from '../models/user-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent {

  constructor(private searchService: SearchService) { }

  users: UserModel[] = [];
  query: string = '';
  search() {
    return this.searchService.searchUsers(this.query)?.subscribe(
      {
        next: (data: UserModel[]) => {
          this.users = data;
        },
        error: (error: any) => {
          console.error('There was an error in getting data', error);
        }
      }
    );
  }
}