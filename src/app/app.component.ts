import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'xchat_app';
  isLoading = true;  // hide router until we know where to go

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.validateToken().subscribe(isValid => {
      if (isValid) {
        this.router.navigate(['/home/friends']);
      }
      this.isLoading = false;  // now show whatever route was navigated to
    });
  }
}
