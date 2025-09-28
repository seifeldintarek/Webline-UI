import { Component, OnInit } from '@angular/core';
import { SearchService } from '../services/search-service.service';
import { UserModel } from '../models/user-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FriendshipService } from '../services/friendship.service';
import { PageResponse } from '../models/page-response';
import { FriendshipModel } from '../models/friendship-model';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  friends: UserModel[] = [];
  friendRequests: UserModel[] = [];

  constructor(private searchService: SearchService,
    private friendshipService: FriendshipService,
    private authService: AuthService
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
          this.users = data.content.filter(u => u.id !== this.authService.getId()!);
        },
        error: (error: any) => {
          alert('There was an error in getting users ');
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
    const isPending = this.friendRequests.some(req => req.id === user.id);

    if (isPending) {
      const friendship: FriendshipModel = {
        id: null,
        senderId: user.id!,
        receiverId: this.authService.getId()!,
        status: null,
        createdAt: null,
        updatedAt: null
      };

      this.friendshipService.removeRequest(friendship).subscribe({
        next: () => {
          this.friendRequests = this.friendRequests.filter(req => req.id !== user.id);
        },
        error: (err) => console.error('Error removing friend request:', err)
      });

    } else {
      this.friendRequests.push(user);
      this.friendshipService.addFriend(user);
    }
  }


}