import { Component, HostListener, OnInit } from '@angular/core';
import { FriendshipService } from '../services/friendship.service';
import { UserModel } from '../models/user-model';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import { ButtonModule } from 'primeng/button';
import { FriendshipModel } from '../models/friendship-model';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit {

  friendRequests: UserModel[] = [];
  page: number = 1;
  image: string = '';
  accepted: boolean = false;

  constructor(private friendshipService: FriendshipService,
    private userService: UserService,
    private authService: AuthService) { }

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

  acceptedFriends = new Set<number>();

  toggleFriend(friend: UserModel) {
    if (this.acceptedFriends.has(friend.id!)) {
      this.acceptedFriends.delete(friend.id!);
      this.removeFriend(friend.id!);
    } else {
      this.acceptedFriends.add(friend.id!);
      this.acceptFriend(friend);
    }
  }

  acceptFriend(friend: UserModel) {
    const currentuser = this.authService.getId();
    let friendship: FriendshipModel = {
      senderId: friend.id,
      receiverId: currentuser!,
      createdAt: null,
      id: null,
      status: null,
      updatedAt: null
    }

    this.friendshipService.acceptRequest(friendship).subscribe({
      next: (response: FriendshipModel) => {
        this.friendshipService.pushFriend(friend);
        this.friendshipService.createConversation(friend.id!).subscribe({
          next: () => { },
          error: (err) => {

          }
        });
      },
      error: (err: any) => {
        alert("error: " + err);
      }
    })
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
        this.friendRequests = this.friendRequests.filter(req => req.id !== uid);
      },
      error: (err) => alert('Error removing friend request: ' + err)
    });
  }

}




