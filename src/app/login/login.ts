import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // =========================
  // UI
  // =========================

  showLoginSection = true;

  showLoginPassword = false;
  showRegisterPassword = false;

  popupMessage = '';

  // =========================
  // LOGIN
  // =========================

  loginUsername = '';
  loginPassword = '';

  // =========================
  // REGISTER
  // =========================

  regFirstName = '';
  regLastName = '';
  regEmail = '';
  regContact = '';
  regBirthDate = '';
  regAge: number | null = null;
  regGender = '';
  regUsername = '';
  regPassword = '';
  regRole = 'admin';

  // =========================
  // ADDRESS
  // =========================

  selectedProvince = '';
  selectedMunicipality = '';
  selectedBarangay = '';

  selectedProvinceName = '';
  selectedMunicipalityName = '';

  provinces: any[] = [];
  municipalities: any[] = [];
  barangays: any[] = [];

  // =========================
  // ON INIT
  // =========================

  ngOnInit(): void {
    this.loadProvinces();
  }

  // =========================
  // LOAD PROVINCES
  // =========================

  loadProvinces() {

    this.http
      .get<any>('https://psgc.gitlab.io/api/provinces/')
      .subscribe((data) => {

        // ONLY MISAMIS ORIENTAL
        this.provinces = data.filter(
          (p: any) => p.name === 'Misamis Oriental'
        );

      });
  }

  // =========================
  // PROVINCE CHANGE
  // =========================

  onProvinceChange() {

    const province = this.provinces.find(
      p => p.code === this.selectedProvince
    );

    this.selectedProvinceName = province?.name || '';

    this.selectedMunicipality = '';
    this.selectedBarangay = '';

    this.municipalities = [];
    this.barangays = [];

    this.http
      .get<any>(
        `https://psgc.gitlab.io/api/provinces/${this.selectedProvince}/cities-municipalities/`
      )
      .subscribe((data) => {

        // ONLY CDO TO VILLANUEVA AREA
        const allowedMunicipalities = [
          'Cagayan de Oro City',
          'Tagoloan',
          'Villanueva'
        ];

        this.municipalities = data.filter((m: any) =>
          allowedMunicipalities.includes(m.name)
        );

      });
  }

  // =========================
  // MUNICIPALITY CHANGE
  // =========================

  onMunicipalityChange() {

    const municipality = this.municipalities.find(
      m => m.code === this.selectedMunicipality
    );

    this.selectedMunicipalityName =
      municipality?.name || '';

    this.selectedBarangay = '';

    this.barangays = [];

    this.http
      .get<any>(
        `https://psgc.gitlab.io/api/cities-municipalities/${this.selectedMunicipality}/barangays/`
      )
      .subscribe((data) => {

        this.barangays = data;

      });
  }

  // =========================
  // PASSWORD TOGGLE
  // =========================

  toggleLoginPassword() {
    this.showLoginPassword =
      !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword =
      !this.showRegisterPassword;
  }

  // =========================
  // POPUP
  // =========================

  showPopup(message: string) {
    this.popupMessage = message;
  }

  closePopup() {
    this.popupMessage = '';
  }

  // =========================
  // SWITCH FORMS
  // =========================

  showRegister() {
    this.showLoginSection = false;
  }

  showLogin() {
    this.showLoginSection = true;
  }

  // =========================
  // COMPUTE AGE
  // =========================

  computeAge() {

  if (!this.regBirthDate) {

    this.regAge = null;
    return;

  }

  const today = new Date();

  const birthDate = new Date(this.regBirthDate);

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() < birthDate.getDate()
    )
  ) {

    age--;

  }

  this.regAge = age;
}

  // =========================
  // REGISTER
  // =========================

  register() {

    const users =
      JSON.parse(
        localStorage.getItem('users') || '[]'
      );

    // =========================
    // EMPTY FIELDS
    // =========================

    if (
      !this.regFirstName ||
      !this.regLastName ||
      !this.regEmail ||
      !this.regContact ||
      !this.selectedProvince ||
      !this.selectedMunicipality ||
      !this.selectedBarangay ||
      !this.regBirthDate ||
      !this.regGender ||
      !this.regUsername ||
      !this.regPassword
    ) {

      this.showPopup(
        'All fields are required!'
      );

      return;
    }

    // =========================
    // EMAIL VALIDATION
    // =========================

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(this.regEmail)) {

      this.showPopup(
        'Invalid email address!'
      );

      return;
    }

    // =========================
    // PHONE VALIDATION
    // =========================

    const phonePattern =
      /^09\d{9}$/;

    if (!phonePattern.test(this.regContact)) {

      this.showPopup(
        'Contact number must follow PH format (09XXXXXXXXX)'
      );

      return;
    }

    // =========================
    // AGE VALIDATION
    // =========================

    if ((this.regAge ?? 0) <= 15) {

      this.showPopup(
        'User must be 16 years old and above.'
      );

      return;
    }

    // =========================
    // PASSWORD VALIDATION
    // =========================

    const passwordPattern =
      /^(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (
      !passwordPattern.test(this.regPassword)
    ) {

      this.showPopup(
        'Password must contain uppercase letter and number.'
      );

      return;
    }

    // =========================
    // USERNAME EXISTS
    // =========================

    if (
      users.find(
        (u: any) =>
          u.username === this.regUsername
      )
    ) {

      this.showPopup(
        'Username already exists!'
      );

      return;
    }

    // =========================
    // SAVE USER
    // =========================

    users.push({

      first_name: this.regFirstName,

      last_name: this.regLastName,

      email: this.regEmail,

      contact: this.regContact,

      address:
        this.selectedBarangay + ', ' +
        this.selectedMunicipalityName + ', ' +
        this.selectedProvinceName,

      dob: this.regBirthDate,

      age: this.regAge,

      gender: this.regGender,

      username: this.regUsername,

      password: this.regPassword,

      role: this.regRole,

      status: 'active',

    });

    localStorage.setItem(
      'users',
      JSON.stringify(users)
    );

    this.showPopup(
      'Registration Successful!'
    );
  }

  // =========================
  // LOGIN
  // =========================

  login() {

    const users =
      JSON.parse(
        localStorage.getItem('users') || '[]'
      );

    const user =
      users.find(
        (u: any) =>
          u.username === this.loginUsername &&
          u.password === this.loginPassword
      );

    if (!user) {

      this.showPopup(
        'Invalid username or password!'
      );

      return;
    }

    localStorage.setItem(
      'currentUser',
      JSON.stringify(user)
    );

    // ROLE BASED

    if (user.role === 'admin') {

      this.router.navigate([
        '/admin-dashboard'
      ]);

    } else {

      this.router.navigate([
        '/treasurer-home'
      ]);

    }
  }
}