import { Component, OnInit } from '@angular/core';
import { FriendshipService } from '../services/friendship.service';
import { CommonModule } from '@angular/common';
import { UserModel } from '../models/user-model';
import { FriendshipModel } from '../models/friendship-model';
import { AuthService } from '../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { ChatComponent } from '../chat/chat.component';


@Component({
  selector: 'app-friendship',
  standalone: true,
  imports: [CommonModule, ButtonModule, ChatComponent],
  templateUrl: './friendship.component.html',
  styleUrls: ['./friendship.component.scss']
})
export class FriendshipComponent implements OnInit {
  constructor(private friendshipService: FriendshipService,
    private authService: AuthService
  ) { }

  friends: UserModel[] = [];
  page: number = 1;
  selectedFriend: UserModel | null = null;

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


  removeFriend(uid: number) {
    const currentuser = this.authService.getId();
    let friendship: FriendshipModel = {
      senderId: uid,
      receiverId: currentuser!,
      createdAt: null,
      id: null,
      status: null,
      updatedAt: null
    }
    this.friendshipService.removeRequest(friendship).subscribe({
      next: () => {
        this.friends = this.friends.filter(req => req.id !== uid);
      },
      error: (err) => console.error('Error removing friend request:', err)
    });
  }

  openChat(friend: UserModel) {
    this.selectedFriend = friend;
  }

  closeChat() {
    this.selectedFriend = null;
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