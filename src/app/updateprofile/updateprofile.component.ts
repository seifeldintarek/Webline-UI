import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';
import { UserModel } from '../models/user-model';

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
  confirmPass: boolean = false;

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
      password: new FormControl(user?.password || '', [Validators.minLength(10)]),
      confirmPassword: new FormControl(user?.password || '')
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.profileForm.valid) {
      console.error('Form is invalid');
      return;
    }

    const formData = this.profileForm.value;

    if (formData.password !== formData.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

    const updatedUser: UserModel = {
      firstName: formData.firstName ?? null,
      lastName: formData.lastName ?? null,
      email: formData.email ?? null,
      mobilePhone: formData.mobilePhone ?? null,
      password: formData.password ?? null,
      id: this.authService.getId()!,
      image: this.image ?? null,
    };

    this.userService.updateUser(updatedUser)?.subscribe({
      next: (res) => this.authService.setCurrentUser(res),
      error: (e) => console.error(e)
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement; // cast
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type. Only JPEG/PNG allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.image = reader.result as string;
    };
    reader.onerror = () => {
      console.error('Error reading file.');
      this.image = '';
    };
    reader.readAsDataURL(file);
  }
}
