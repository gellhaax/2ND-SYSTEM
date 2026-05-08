import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css'
})
export class AdminNotifications implements OnInit {

  pendingApproval: any = null;
  notifications: any[] = [
    { title: 'Tuition Fee Reminder', message: 'Tuition fee for 2nd Term is due on May 25, 2024.', type: 'Reminder', recipients: 'All Students', date: 'May 20, 2024', status: 'Unread' },
    { title: 'Payment Received', message: 'A payment of ₱5,000.00 has been received for Juan Dela Cruz.', type: 'Information', recipients: 'Juan Dela Cruz', date: 'May 19, 2024', status: 'Read' },
    { title: 'Overdue Notice', message: 'Your account has an overdue balance. Please pay as soon as possible.', type: 'Notice', recipients: 'Parents with Balance', date: 'May 18, 2024', status: 'Read' },
    { title: 'Upcoming Fee Collection', message: 'Fee collection for 1st Term (SY 2024-2025) will start on June 1, 2024.', type: 'Announcement', recipients: 'All Students', date: 'May 17, 2024', status: 'Read' },
  ];

  ngOnInit() {
    this.loadPendingApproval();
    window.addEventListener('storage', () => this.loadPendingApproval());
  }

  loadPendingApproval() {
    const data = localStorage.getItem('pendingApproval');
    this.pendingApproval = data ? JSON.parse(data) : null;
  }

  approveEdit() {
    if (!this.pendingApproval) return;
    localStorage.setItem('approvalResult', JSON.stringify({
      status: 'approved',
      data: this.pendingApproval.data
    }));
    localStorage.removeItem('pendingApproval');
    window.dispatchEvent(new Event('storage'));
    this.pendingApproval = null;
    alert('Edit request APPROVED!');
  }

  rejectEdit() {
    if (!this.pendingApproval) return;
    localStorage.setItem('approvalResult', JSON.stringify({
      status: 'rejected'
    }));
    localStorage.removeItem('pendingApproval');
    window.dispatchEvent(new Event('storage'));
    this.pendingApproval = null;
    alert('Edit request REJECTED!');
  }

  get totalNotifications() { return this.notifications.length + (this.pendingApproval ? 1 : 0); }
  get unreadCount() { return this.notifications.filter(n => n.status === 'Unread').length + (this.pendingApproval ? 1 : 0); }
  get importantCount() { return this.notifications.filter(n => n.type === 'Notice' || n.type === 'Reminder').length; }
}