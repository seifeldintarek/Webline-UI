import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserModel } from '../../models/user-model';


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
      mobilePhone: ['', [Validators.pattern('^01[0125][0-9]{8}$'), Validators.minLength(11), Validators.maxLength(11)]],
      password: ['', [Validators.required, Validators.minLength(10)]],
      image: ['']
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const newUser: UserModel = {
        id: null,
        firstName: this.signupForm.value.firstName,
        lastName: this.signupForm.value.lastName,
        email: this.signupForm.value.email,
        mobilePhone: this.signupForm.value.mobilePhone,
        password: this.signupForm.value.password,
        image: this.signupForm.value.image || ''
      };
      console.log('user image:', newUser.image);
      this.authService.signup(newUser).subscribe({
        next: () => {
          this.router.navigate(['login'], { replaceUrl: true });
          console.log(`User ${this.signupForm.value.firstName} registered successfully`);
        },
        error: (err) => console.error(err),
      });
    }
    else {
      const errors: string[] = [];

      Object.keys(this.signupForm.controls).forEach(key => {
        const controlErrors = this.signupForm.get(key)?.errors;
        if (controlErrors) {
          Object.keys(controlErrors).forEach(errorKey => {
            errors.push(`${key} has error: ${errorKey}`);
          });
        }
      });

      alert('Invalid input:\n' + errors.join('\n'));
    }
  }
}


