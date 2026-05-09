import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminNavbarComponent],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboard implements OnInit {

  currentUser: any = null;
  today = new Date();
  records: any[] = [];

  ngOnInit() {
    const user = localStorage.getItem('currentUser');
    if (user) this.currentUser = JSON.parse(user);
    const data = localStorage.getItem('records');
    this.records = data ? JSON.parse(data) : [];
  }

  get totalStudents(): number {
    return this.records.length;
  }

  get totalCollected(): number {
    let total = 0;
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get pendingBalance(): number {
    let total = 0;
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        total += Number(t.balance || 0);
      });
    });
    return total;
  }

  get collectionRate(): number {
    const total = this.totalCollected + this.pendingBalance;
    if (total === 0) return 0;
    return Math.round((this.totalCollected / total) * 100);
  }

  get recentPayments(): any[] {
    const all: any[] = [];
    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {
        all.push({
          name: `${s.firstName} ${s.lastName}`,
          course: s.course + ' - ' + s.year,
          amount: t.amount,
          status: t.status,
          date: t.date
        });
      });
    });
    return all.slice(-5).reverse();
  }
    get weeklyTotal(): number {
    const now = new Date();

    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay());

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    let total = 0;

    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {

        const paymentDate = new Date(t.date);

        if (paymentDate >= firstDay && paymentDate <= lastDay) {
          total += Number(t.amount || 0);
        }

      });
    });

    return total;
  }

  get monthlyTotal(): number {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let total = 0;

    this.records.forEach(s => {
      (s.transactions || []).forEach((t: any) => {

        const paymentDate = new Date(t.date);

        if (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        ) {
          total += Number(t.amount || 0);
        }

      });
    });

    return total;
  }

  get currentMonth(): string {
    return this.today.toLocaleString('default', {
      month: 'long',
      year: 'numeric'
    });
  }

  get weekRange(): string {

    const now = new Date();

    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - now.getDay());

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);

    return `${firstDay.toLocaleDateString()} - ${lastDay.toLocaleDateString()}`;
  }
}