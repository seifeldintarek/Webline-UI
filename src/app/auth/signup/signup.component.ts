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

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = () => {
          this.signupForm.patchValue({
            image: reader.result as string
          });
          console.log('File converted to base64 successfully');
        };
        reader.onerror = () => {
          console.error('Error reading file');
          event.target.value = ''; // Reset file input on error
          this.signupForm.patchValue({ image: null });
        };
        reader.readAsDataURL(file);
      } else {
        console.error('Invalid file type. Please select a JPEG or PNG image.');
        event.target.value = '';
        this.signupForm.patchValue({ image: null });
      }
    } else {
      this.signupForm.patchValue({ image: null });
    }
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      console.log('Form valid', this.signupForm.value);
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
      console.warn('Form is invalid', this.signupForm.errors);
    }
  }
}


