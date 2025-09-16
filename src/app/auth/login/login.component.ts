import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      password: ['', [Validators.required]],
    });
  }

  navigateToSignup(event: Event) {
    event.preventDefault();
    this.router.navigate(['signup']).catch(err => {
      console.error('Navigation to signup failed', err);
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.login(email, password);
    } else {
      console.warn('Form is invalid');
      this.loginForm.markAllAsTouched();
    }
  }

  private login(email: string, password: string) {
    this.authService.login(email, password).subscribe({
      next: (response: any): void => {
        console.log('Login successful:', response);
        this.authService.assignToken(response['access_token']);
        this.router.navigate(['home']).catch(err => {
          console.error('Navigation to home failed', err);
        });
      },
      error: (error) => console.log('Error : ', error)
    });
  }
}
