import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-home.html',
  styleUrl: './treasurer-home.css',
})
export class Home implements OnInit {

  records: any[] = [];

  // notifications list (safe default)
  notifications: any[] = [];

 ngOnInit() {
  this.loadData();
  this.loadNotifications();
  this.checkApprovalResult(); // 🔥 IMPORTANT FIX

  window.addEventListener('storage', () => {
    this.loadData();
    this.loadNotifications();
    this.checkApprovalResult();
  });
}
checkApprovalResult() {

  const result = localStorage.getItem('approvalResult');

  if (!result) return;

  const parsed = JSON.parse(result);

  if (parsed.status === 'approved') {

    this.addNotification("✅ Your request was APPROVED by Admin");

  } else if (parsed.status === 'rejected') {

    this.addNotification("❌ Your request was REJECTED by Admin");

  }

  localStorage.removeItem('approvalResult');
}

  // ======================
  // RECORDS
  // ======================
  loadData() {
    const data = localStorage.getItem('records');
    this.records = data ? JSON.parse(data) : [];
  }

  // ======================
  // NOTIFICATIONS
  // ======================
  loadNotifications() {
    const data = localStorage.getItem('notifications');

    try {
      this.notifications = data ? JSON.parse(data) : [];
    } catch (e) {
      this.notifications = [];
    }

    // newest first + safety
    this.notifications = this.notifications
      .map(n => ({
        message: n.message || '',
        read: n.read ?? false,
        date: n.date ? new Date(n.date) : new Date()
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // ======================
  // ADD NOTIFICATION (IMPORTANT FIX)
  // ======================
  addNotification(message: string) {
    this.notifications.unshift({
      message,
      read: false,
      date: new Date()
    });

    this.saveNotifications();
  }

  // ======================
  // ACTIONS
  // ======================
  markAsRead(notif: any) {
    notif.read = true;
    this.saveNotifications();
  }

  markAsUnread(notif: any) {
    notif.read = false;
    this.saveNotifications();
  }

  deleteNotification(notif: any) {
    const confirmDelete = confirm('Delete this notification?');
    if (!confirmDelete) return;

    this.notifications = this.notifications.filter(n => n !== notif);
    this.saveNotifications();
  }

  // ======================
  // TOTALS
  // ======================
  get totalCash(): number {
    let total = 0;

    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'Cash') {
          total += Number(t.amount || 0);
        }
      });
    });

    return total;
  }

  get totalGCash(): number {
    let total = 0;

    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'GCash') {
          total += Number(t.amount || 0);
        }
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