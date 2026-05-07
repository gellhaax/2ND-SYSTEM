import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (user.role !== 'admin') {
      this.router.navigate(['/login']);
    }
  }

}