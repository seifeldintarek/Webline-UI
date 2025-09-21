import { Component, OnInit } from '@angular/core';
import { FriendshipService } from '../services/friendship.service';
import { UserModel } from '../models/user-model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {

  friendRequests: UserModel[] = [];
  page: number = 1;

  constructor(private friendshipService: FriendshipService) { }

  ngOnInit() {
    this.loadFriendRequests();
  }

  loadFriendRequests() {
    this.friendshipService.getFriendRequests(this.page).subscribe({
      next: (data) => {
        this.friendRequests = data.content;
      },
      error: (error) => {
        console.error('Error loading friend requests:', error);
      }
    });
  }

  nextPage() {
    this.page++;
    this.loadFriendRequests();
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadFriendRequests();
    }
  }
}




