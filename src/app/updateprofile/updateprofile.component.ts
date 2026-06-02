import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user-model';

// Cross-field validator: confirmPassword must match password
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const form = control.parent;
  if (!form) return null;
  const password = form.get('password')?.value;
  const confirm = control.value;
  return password === confirm ? null : { mismatch: true };
}

// Normalize a stored phone number to the local 01XXXXXXXXX shape the regex expects.
// Without this, a pre-filled value in international/spaced format (+20..., "012 345...")
// fails Validators.pattern, the form starts invalid, and the Save button is dead on load.
function normalizeEgPhone(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/[\s-]/g, '')   // strip spaces and dashes
    .replace(/^\+20/, '0')   // +2010... -> 010...
    .replace(/^0020/, '0');  // 002010... -> 010...
}

@Component({
  selector: 'app-updateprofile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './updateprofile.component.html',
  styleUrls: ['./updateprofile.component.scss']
})
export class UpdateProfileComponent implements OnInit {

  profileForm!: FormGroup;
  image: string = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const user = this.authService.getUser();
    this.profileForm = new FormGroup({
      firstName: new FormControl(user?.firstName || ''),
      lastName: new FormControl(user?.lastName || ''),
      email: new FormControl(user?.email || '', [
        Validators.email,
        Validators.maxLength(50),
        // Mirrors the @Size(max = 50) and @Pattern on User.email
        Validators.pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
      ]),
      mobilePhone: new FormControl(normalizeEgPhone(user?.mobilePhone), [
        Validators.pattern(/^01[0125][0-9]{8}$/)
      ]),
      password: new FormControl('', [Validators.minLength(10)]),
      confirmPassword: new FormControl('', [passwordMatchValidator])
    });

    // Re-run confirmPassword validator whenever password changes
    this.profileForm.get('password')?.valueChanges.subscribe(() => {
      this.profileForm.get('confirmPassword')?.updateValueAndValidity();
    });

    // Pre-fill existing avatar if stored
    if (user?.image) {
      this.image = user.image;
    }
  }

  onSubmit() {
    const updatedUser: any = {
      id: this.authService.getId()
    };

    const firstName = this.profileForm.get('firstName');
    const lastName = this.profileForm.get('lastName');
    const email = this.profileForm.get('email');
    const mobilePhone = this.profileForm.get('mobilePhone');
    const password = this.profileForm.get('password');

    if (firstName?.value?.trim()) {
      updatedUser.firstName = firstName.value.trim();
    }

    if (lastName?.value?.trim()) {
      updatedUser.lastName = lastName.value.trim();
    }

    if (email?.value?.trim() && email.valid) {
      updatedUser.email = email.value.trim();
    }

    if (mobilePhone?.value?.trim() && mobilePhone.valid) {
      updatedUser.mobilePhone = mobilePhone.value.trim();
    }

    if (password?.value?.trim() && password.valid) {
      updatedUser.password = password.value;
    }

    if (this.image) {
      updatedUser.image = this.image;
      this.userService.setImage(this.image).subscribe({
        next: (res) => {
          const user = this.authService.getUser()!;
          user.image = this.image;
          this.authService.setCurrentUser(user);
        },
        error: (err) => {
          alert("error uploading new profile picture")
        }
      });
    }

    this.userService.updateUser(updatedUser)?.subscribe({
      next: (res) => {
        this.authService.setCurrentUser(res);
      },
      error: (err) => {
        alert('Profile update failed:' + err);
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG/PNG allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => { this.image = reader.result as string; };
    reader.onerror = () => { this.image = ''; };
    reader.readAsDataURL(file);
  }

  // Returns 1 (weak) | 2 (medium) | 3 (strong)
  getPasswordStrength(): number {
    const pw: string = this.profileForm.get('password')?.value || '';
    let score = 0;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    return Math.max(score, pw.length > 0 ? 1 : 0);
  }

  getPasswordStrengthLabel(): string {
    const s = this.getPasswordStrength();
    if (s >= 3) return 'Strong';
    if (s === 2) return 'Medium';
    return 'Weak';
  }
}
