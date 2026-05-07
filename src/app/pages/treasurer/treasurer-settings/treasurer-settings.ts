import { Component, HostBinding, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treasurer-settings.html',
  styleUrls: ['./treasurer-settings.css']
})
export class Settings implements OnInit {

  user: any = null;

  // 🌙 Dark Mode (component level - KEEP)
  @HostBinding('class.dark-mode') darkMode = false;

  // 🔒 Password fields
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordMessage = '';

  // 🖼 Profile image
  profilePreview: string | ArrayBuffer | null = null;

  // ✏️ Edit toggle
  showEdit = false;

  constructor(private router: Router) {

    // Load current user
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    // Load dark mode
    const mode = localStorage.getItem('darkMode');
    this.darkMode = mode === 'true';

    // 🔥 APPLY GLOBAL DARK MODE
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    }
  }

  ngOnInit(): void {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      this.profilePreview = savedImage;
    }
  }

  // 🌙 Toggle Dark Mode (GLOBAL + LOCAL)
  switchMode() {
    this.darkMode = !this.darkMode;

    localStorage.setItem('darkMode', this.darkMode.toString());

    if (this.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  // 🔄 Switch Account
  switchAccount() {
    this.logout();
  }

  // 🚪 Logout
  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }

  // 🔒 Change Password
  changePassword() {
    this.passwordMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordMessage = 'All fields are required!';
      return;
    }

    if (this.currentPassword !== this.user.password) {
      this.passwordMessage = 'Current password is incorrect!';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'New passwords do not match!';
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((u: any) => u.username === this.user.username);

    if (index >= 0) {
      users[index].password = this.newPassword;
      localStorage.setItem('users', JSON.stringify(users));

      this.user.password = this.newPassword;
      localStorage.setItem('currentUser', JSON.stringify(this.user));

      this.passwordMessage = 'Password changed successfully!';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }
  }

  // ✏️ Toggle edit profile
  toggleEdit() {
    this.showEdit = !this.showEdit;
  }

  // 💾 Save profile
  saveProfile() {
    alert('Profile updated successfully!');
    this.showEdit = false;
  }

  // 🖼 Upload profile image
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large! Max 2MB only.');
      return;
    }

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