import { Component, OnInit } from '@angular/core';
import { FriendshipService } from '../services/friendship.service';
import { CommonModule } from '@angular/common';
import { UserModel } from '../models/user-model';

@Component({
  selector: 'app-friendship',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friendship.component.html',
  styleUrls: ['./friendship.component.scss']
})
export class FriendshipComponent implements OnInit {
  constructor(private friendshipService: FriendshipService) { }

  friends: UserModel[] = [];
  page: number = 1;

  ngOnInit() {
    this.getFriends();
  }

  getFriends() {
    this.friendshipService.getUserFriends(this.page).subscribe({
      next: (data) => {
        this.friends = data.content;
      }
    });
  }

  nextPage() {
    this.friendshipService.getUserFriends(this.page + 1).subscribe({
      next: (data) => {
        if (data.content.length > 0) {
          this.friends = data.content;
          this.page++;
        }
      }
    });
  }

  prevPage() {
    if (this.page > 1) {
      this.friendshipService.getUserFriends(this.page - 1).subscribe({
        next: (data) => {
          this.friends = data.content;
          this.page--;
        }
      });
    }
  }
}