import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule], // Remove SignupComponent from here
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private router: Router) { }

  navigateToSignup(event: Event) {
    console.log('Navigating to signup');
    event.preventDefault();
    this.router.navigate(['/auth/signup']).then(() => {
      console.log('Navigation to signup successful');
    }).catch(err => {
      console.error('Navigation to signup failed', err);
    });
  }
}