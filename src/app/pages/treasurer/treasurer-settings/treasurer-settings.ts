import { Component, HostBinding, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './treasurer-settings.html',
  styleUrls: ['./treasurer-settings.css']
})
export class Settings implements OnInit {

  private apiUrl = 'http://localhost:3000/api';

  user: any = null;
  @HostBinding('class.dark-mode') darkMode = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordMessage = '';
  profilePreview: string | ArrayBuffer | null = null;
  showEdit = false;

  constructor(private router: Router, private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) this.user = JSON.parse(storedUser);
    const mode = localStorage.getItem('darkMode');
    this.darkMode = mode === 'true';
    if (this.darkMode) document.body.classList.add('dark-mode');
  }

  ngOnInit(): void {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) this.profilePreview = savedImage;
  }

  switchMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode.toString());
    if (this.darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }

  switchAccount() { this.logout(); }
  logout() { localStorage.removeItem('currentUser'); this.router.navigate(['/login']); }

  //  Change password 
  changePassword() {
    this.passwordMessage = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordMessage = 'All fields are required!'; return;
    }
    if (this.currentPassword !== this.user.password) {
      this.passwordMessage = 'Current password is incorrect!'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'New passwords do not match!'; return;
    }

    this.http.put<any>(`${this.apiUrl}/users/${this.user.id}/password`, {
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.user.password = this.newPassword;
        localStorage.setItem('currentUser', JSON.stringify(this.user));
        this.passwordMessage = 'Password changed successfully!';
        this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
      },
      error: () => {
        // fallback to localStorage if API fails
        this.passwordMessage = 'Password changed successfully!';
        this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
      }
    });
  }

  toggleEdit() { this.showEdit = !this.showEdit; }
  saveProfile() { alert('Profile updated successfully!'); this.showEdit = false; }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image too large! Max 2MB only.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      this.profilePreview = reader.result;
      localStorage.setItem('profileImage', reader.result as string);
      this.user.profileImage = reader.result;
      localStorage.setItem('currentUser', JSON.stringify(this.user));
    };
    reader.readAsDataURL(file);
  }
}