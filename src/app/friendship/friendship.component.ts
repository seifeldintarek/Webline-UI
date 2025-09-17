import { Component } from '@angular/core';
import { FriendshipService } from '../services/friendship.service';
import { User } from '../user/user.component';
import { CommonModule } from '@angular/common';
import { UserModel } from '../models/user-model';

@Component({
  selector: 'app-friendship',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friendship.component.html',
  styleUrls: ['./friendship.component.scss']
})
export class FriendshipComponent {
  constructor(private friendshipService: FriendshipService) { }

  private friends: UserModel[] = [];

  getFriends() {
    this.friends = this.friendshipService.getUserFriends();
    return this.friends;
  }
}
