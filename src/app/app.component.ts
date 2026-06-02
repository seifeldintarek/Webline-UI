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
  title = 'Webline Chat App';
  isLoading = true;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.validateToken().subscribe(isValid => {
      if (isValid) {
        this.router.navigate(['/home/search']);
      }
      this.isLoading = false;
    });
  }
}
