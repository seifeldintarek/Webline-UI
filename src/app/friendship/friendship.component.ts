import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FriendshipService } from '../services/friendship.service';
import { CommonModule } from '@angular/common';
import { UserModel } from '../models/user-model';
import { FriendshipModel } from '../models/friendship-model';
import { AuthService } from '../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { MessageService } from '../services/message.service';
import { ConversationType } from '../models/conversation-model';

@Component({
  selector: 'app-friendship',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterOutlet], // Add RouterOutlet, remove ChatComponent
  templateUrl: './friendship.component.html',
  styleUrls: ['./friendship.component.scss']
})
export class FriendshipComponent implements OnInit {
  friends: UserModel[] = [];
  page: number = 1;

  constructor(
    private friendshipService: FriendshipService,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.getFriends();
  }

  getFriends() {
    this.friendshipService.getUserFriends(this.page).subscribe({
      next: (data) => {
        this.friends = data.content;
        console.log('Loaded friends:', this.friends);
      },
      error: (err) => {
        console.error('Error loading friends:', err);
      }
    });
  }

  openChat(friend: UserModel) {
    if (!friend.id) {
      console.error('Friend ID is missing!', friend);
      return;
    }
    this.router.navigate(['chat', friend.id], {
      relativeTo: this.route,
      state: { user: friend }
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
    };

    this.friendshipService.getConverstaion([uid], ConversationType.PRIVATE).subscribe({
      next: (data) => {
        this.friendshipService.removeRequest(friendship).subscribe({
          next: () => {
            console.log('Friend removed successfully');
            this.messageService.deleteConversation(data.id!);
            this.friends = this.friends.filter(req => req.id !== uid);

            this.router.navigate(['friends']);
          },
          error: (err) => {
            console.error('Error removing friend request:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching conversation:', err);
      }
    });
  }

  nextPage() {
    this.friendshipService.getUserFriends(this.page + 1).subscribe({
      next: (data) => {
        if (data.content.length > 0) {
          this.friends = data.content;
          this.page++;
          console.log('Moved to page:', this.page);
        }
      },
      error: (err) => {
        console.error('Error loading next page:', err);
      }
    });
  }

  prevPage() {
    if (this.page > 1) {
      this.friendshipService.getUserFriends(this.page - 1).subscribe({
        next: (data) => {
          this.friends = data.content;
          this.page--;
          console.log('Moved to page:', this.page);
        },
        error: (err) => {
          console.error('Error loading previous page:', err);
        }
      });
    }
  }
}
