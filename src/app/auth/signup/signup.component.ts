import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      mobilePhone: ['', [Validators.required, Validators.pattern('^01[0125][0-9]{8}$'), Validators.minLength(11), Validators.maxLength(11)]],
      password: ['', [Validators.required, Validators.minLength(10)]],
      image: [null]
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.signupForm.patchValue({ image: file });
    }
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.authService.signup(this.signupForm.value).subscribe({
        next: () => {
          this.router.navigate(['login']);
          console.log(`User ${this.signupForm.value.firstName} registered successfully`);
        },
        error: (err) => console.error(err),
      });
    }
  }
}


