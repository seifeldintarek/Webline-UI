import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../search/search.component';
import { Router } from '@angular/router';
import { FriendshipComponent } from '../friendship/friendship.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchComponent, FriendshipComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.initUserFromToken();
  }

  selectedView: string = '';

  selectView(view: string) {
    this.selectedView = view;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['login'], { replaceUrl: true })
      .catch(err => console.error('Navigation to login failed', err));
  }

}
