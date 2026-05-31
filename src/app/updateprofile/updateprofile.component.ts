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
      email: new FormControl(user?.email || '', [Validators.email]),
      mobilePhone: new FormControl(user?.mobilePhone || '', [
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
    if (!this.profileForm.valid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formData = this.profileForm.value;

    const updatedUser: UserModel = {
      firstName: formData.firstName ?? null,
      lastName: formData.lastName ?? null,
      email: formData.email ?? null,
      mobilePhone: formData.mobilePhone ?? null,
      password: formData.password || null,
      id: this.authService.getId()!,
      image: this.image ?? null,
    };

    this.userService.updateUser(updatedUser)?.subscribe({
      next: (res) => this.authService.setCurrentUser(res),
      error: (e) => console.error(e)
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type. Only JPEG/PNG allowed.');
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
