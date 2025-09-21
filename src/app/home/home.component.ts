import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../search/search.component';
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
  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.initUserFromToken();
  }

  selectedView: string = '';

  selectView(view: string) {
    this.selectedView = view;
  }


}
