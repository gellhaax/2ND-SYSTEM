import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  constructor(private router: Router) {}

  showLoginSection = true;

  // LOGIN
  loginUsername = '';
  loginPassword = '';
  loginError = '';

  // REGISTER
  regFirstName = '';
  regLastName = '';
  regEmail = '';
  regContact = '';
  regAddress = '';
  regBirthDate = '';
  regAge: number | null = null;
  regGender = '';
  regUsername = '';
  regPassword = '';
  regRole = 'admin';
  registerMessage = '';

  // Toggle sections
  showRegister() {
    this.showLoginSection = false;
    this.loginError = '';
  }

  showLogin() {
    this.showLoginSection = true;
    this.registerMessage = '';
  }

  computeAge() {
    if (!this.regBirthDate) return;
    const today = new Date();
    const dob = new Date(this.regBirthDate);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    this.regAge = age;
  }

  register() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (!this.regUsername || !this.regPassword) {
      this.registerMessage = 'Username and password are required!';
      return;
    }

    const pattern = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!pattern.test(this.regPassword)) {
      this.registerMessage =
        'Invalid password. It must contain at least 6 characters, one uppercase letter, and one number';
      return;
    }

    if (users.find((u: any) => u.username === this.regUsername)) {
      this.registerMessage = 'Username already exists!';
      return;
    }

    users.push({
      first_name: this.regFirstName,
      last_name: this.regLastName,
      email: this.regEmail,
      contact: this.regContact,
      address: this.regAddress,
      dob: this.regBirthDate,
      age: this.regAge,
      gender: this.regGender,
      username: this.regUsername,
      password: this.regPassword,
      role: this.regRole,
      status: 'active',
    });

    localStorage.setItem('users', JSON.stringify(users));
    this.registerMessage = 'Registration successful!';
  }

  login() {

  const users = JSON.parse(localStorage.getItem('users') || '[]');

  const user = users.find(
    (u: any) =>
      u.username === this.loginUsername &&
      u.password === this.loginPassword
  );

  if (!user) {

    this.loginError = 'Invalid username or password!';
    return;

  }

  // SAVE LOGGED-IN USER
  localStorage.setItem('currentUser', JSON.stringify(user));

  // ROLE BASED REDIRECT
  if (user.role === 'admin') {

    this.router.navigate(['/admin-dashboard']);

  } else if (user.role === 'treasurer') {

    this.router.navigate(['/home']);

  }

}
}