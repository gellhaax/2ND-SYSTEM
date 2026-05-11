import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-home.html',
  styleUrl: './treasurer-home.css',
})
export class Home implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private routerSub!: Subscription;

  records: any[] = [];
  notifications: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef  // ✅ ADD THIS
  ) {}

  ngOnInit() {
    this.loadData();
    this.loadNotifications();
    this.checkApprovalResult();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadData();
      this.loadNotifications();
      this.checkApprovalResult();
    });

    window.addEventListener('storage', () => {
      this.checkApprovalResult();
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  loadData() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.records = data;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE
      },
      error: (err) => console.error('Error:', err)
    });
  }

  checkApprovalResult() {
    const result = localStorage.getItem('approvalResult');
    if (!result) return;
    const parsed = JSON.parse(result);
    if (parsed.status === 'approved') {
      this.addNotification("✅ Your request was APPROVED by Admin");
      this.loadData();
    } else if (parsed.status === 'rejected') {
      this.addNotification("❌ Your request was REJECTED by Admin");
    }
    localStorage.removeItem('approvalResult');
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  loadNotifications() {
    const data = localStorage.getItem('notifications');
    try {
      this.notifications = data ? JSON.parse(data) : [];
    } catch (e) {
      this.notifications = [];
    }
    this.notifications = this.notifications
      .map(n => ({
        message: n.message || '',
        read: n.read ?? false,
        date: n.date ? new Date(n.date) : new Date()
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  addNotification(message: string) {
    this.notifications.unshift({ message, read: false, date: new Date() });
    this.saveNotifications();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  markAsRead(notif: any) {
    notif.read = true;
    this.saveNotifications();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  markAsUnread(notif: any) {
    notif.read = false;
    this.saveNotifications();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  deleteNotification(notif: any) {
    if (!confirm('Delete this notification?')) return;
    this.notifications = this.notifications.filter(n => n !== notif);
    this.saveNotifications();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  get totalCash(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'Cash') total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get totalGCash(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'GCash') total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get totalPayment(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        total += Number(t.amount || 0);
      });
    });
    return total;
  }
}