import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'xchat_app';

  constructor(private authService: AuthService) { }
  @HostListener('window:load')
  onLoad() {
    this.authService.loadTokenFromStorage();
  }
}
