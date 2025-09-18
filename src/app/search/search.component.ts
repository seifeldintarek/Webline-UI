import { Component, OnInit } from '@angular/core';
import { SearchService } from '../services/search-service.service';
import { UserModel } from '../models/user-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FriendshipService } from '../services/friendship.service';
import { PageResponse } from '../models/page-response';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  friends: UserModel[] = [];
  friendRequests: UserModel[] = [];

  constructor(private searchService: SearchService,
    private friendshipService: FriendshipService
  ) { }

  ngOnInit() {
    this.friendshipService.getUserFriends().subscribe({
      next: (data) => this.friends = data.content
    });
    this.friendshipService.getMyFriendRequests().subscribe({
      next: (data) => this.friendRequests = data.content
    });
  }

  users: UserModel[] = [];
  query: string = '';
  page: number = 1;
  search(page: number = 1) {
    this.page = page;
    return this.searchService.searchUsers(this.query, page)?.subscribe(
      {
        next: (data: PageResponse<UserModel>) => {
          this.users = data.content;
        },
        error: (error: any) => {
          console.error('There was an error in getting data', error);
        }
      }
    );
  }

  nextPage() {
    this.search(this.page + 1);
  }

  prevPage() {
    if (this.page > 1) {
      this.search(this.page - 1);
    }
  }

  isFriend(user: UserModel): boolean {
    return this.friends.some(friend => friend.id === user.id);
  }

  isPending(user: UserModel): boolean {
    return this.friendRequests.some(request => request.id === user.id);
  }

  addFriend(user: UserModel) {
    this.friendshipService.addFriend(user);
  }
}