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


  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = () => {
          this.image = reader.result as string;
          console.log('File converted to base64 successfully');

          // Move the upload here so it happens after the file is read
          this.userService.setImage(this.image).subscribe({
            next: (response) => {
              console.log('Image uploaded successfully:', response);
            },
            error: (error) => {
              console.error('Error uploading image:', error);
            }
          });
        };
        reader.onerror = () => {
          console.error('Error reading file');
          event.target.value = ''; // Reset file input on error
          this.image = '';
        };
        reader.readAsDataURL(file);
      } else {
        console.error('Invalid file type. Please select a JPEG or PNG image.');
        event.target.value = '';
        this.image = '';
      }
    } else {
      console.error('No file selected');
      this.image = '';
    }
  }

  toggleFriend(id: number) {
    this.accepted = !this.accepted;
    if (this.accepted) {
      this.acceptFriend(id);
    } else {
      this.removeFriend(id);
    }
  }

  acceptFriend(uid: number) {
    const currentuser = this.authService.getId();
    let friendship: FriendshipModel = {
      senderId: uid,
      receiverId: currentuser!,
      createdAt: null,
      id: null,
      status: null,
      updatedAt: null
    }
    this.friendshipService.acceptRequest(friendship).subscribe({
      next: (response: FriendshipModel) => {
        friendship = response;
      },
      error: (err: any) => {
        console.log("error: " + err);
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
      error: (err) => console.error('Error removing friend request:', err)
    });
  }

}




