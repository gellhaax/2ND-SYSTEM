import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-home.html',
  styleUrl: './treasurer-home.css',
})
export class Home implements OnInit {

  private apiUrl = 'http://localhost:3000/api';
  records: any[] = [];
  notifications: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
    this.loadNotifications();
    this.checkApprovalResult();
    window.addEventListener('storage', () => {
      this.checkApprovalResult();
    });
  }

 
  loadData() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => { this.records = data; },
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
  }

  loadNotifications() {
    const data = localStorage.getItem('notifications');
    try {
      this.notifications = data ? JSON.parse(data) : [];
    } catch (e) {
      this.notifications = [];
    }
    this.notifications = this.notifications
      .map(n => ({ message: n.message || '', read: n.read ?? false, date: n.date ? new Date(n.date) : new Date() }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  saveNotifications() { localStorage.setItem('notifications', JSON.stringify(this.notifications)); }

  addNotification(message: string) {
    this.notifications.unshift({ message, read: false, date: new Date() });
    this.saveNotifications();
  }

  markAsRead(notif: any) { notif.read = true; this.saveNotifications(); }
  markAsUnread(notif: any) { notif.read = false; this.saveNotifications(); }

  deleteNotification(notif: any) {
    if (!confirm('Delete this notification?')) return;
    this.notifications = this.notifications.filter(n => n !== notif);
    this.saveNotifications();
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