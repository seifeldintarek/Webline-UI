import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../search/search.component';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FriendshipComponent } from '../friendship/friendship.component';
import { ChatComponent } from '../chat/chat.component';
import { AuthService } from '../services/auth.service';
import { RequestsComponent } from '../requests/requests.component';
import { UpdateProfileComponent } from '../updateprofile/updateprofile.component';
import { GroupsComponent } from '../groups/groups.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchComponent, GroupsComponent, FriendshipComponent, RequestsComponent, ChatComponent, UpdateProfileComponent,
    RouterOutlet, RouterLink, RouterLinkActive
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.initUserFromToken();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['login'], { replaceUrl: true })
      .catch(err => console.error('Navigation to login failed', err));
  }

}
