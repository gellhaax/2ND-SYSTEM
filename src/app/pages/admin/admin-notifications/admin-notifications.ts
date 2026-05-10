import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './admin-notifications.html',
  styleUrl: './admin-notifications.css'
})
export class AdminNotifications implements OnInit {

  private apiUrl = 'http://localhost:3000/api';
  requests: any[] = [];

  notifications: any[] = [
    { title: 'Tuition Fee Reminder', message: 'Tuition fee for 2nd Term is due on May 25, 2024.', type: 'Reminder', recipients: 'All Students', date: 'May 20, 2024', status: 'Unread' },
    { title: 'Payment Received', message: 'A payment of ₱5,000.00 has been received for Juan Dela Cruz.', type: 'Information', recipients: 'Juan Dela Cruz', date: 'May 19, 2024', status: 'Read' },
    { title: 'Overdue Notice', message: 'Your account has an overdue balance. Please pay as soon as possible.', type: 'Notice', recipients: 'Parents with Balance', date: 'May 18, 2024', status: 'Read' },
    { title: 'Upcoming Fee Collection', message: 'Fee collection for 1st Term will start on June 1, 2024.', type: 'Announcement', recipients: 'All Students', date: 'May 17, 2024', status: 'Read' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadRequests(); }

  // Load 
  loadRequests() {
    this.http.get<any[]>(`${this.apiUrl}/approvals/pending`).subscribe({
      next: (data) => {
        this.requests = data.map(r => ({
          ...r,
          selected: false,
          requestedData: typeof r.requestedData === 'string' ? JSON.parse(r.requestedData) : r.requestedData,
          originalData: typeof r.originalData === 'string' ? JSON.parse(r.originalData) : r.originalData
        }));
      },
      error: (err) => console.error('Error loading approvals:', err)
    });
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.requests.forEach(r => r.selected = checked);
  }

  isAllSelected(): boolean {
    return this.requests.length > 0 && this.requests.every(r => r.selected);
  }

  //  Approve
  approveSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select request first.'); return; }

    const approvals = selected.map(r =>
      this.http.put(`${this.apiUrl}/approvals/${r.id}`, { status: 'approved' }).toPromise()
    );

    Promise.all(approvals).then(() => {
      // notify treasurer
      localStorage.setItem('approvalResult', JSON.stringify({ status: 'approved', time: Date.now() }));
      window.dispatchEvent(new Event('storage'));
      alert('Selected requests approved.');
      this.loadRequests();
    }).catch(err => alert('Error approving requests'));
  }

  // Reject 
  declineSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select request first.'); return; }

    const rejections = selected.map(r =>
      this.http.put(`${this.apiUrl}/approvals/${r.id}`, { status: 'rejected' }).toPromise()
    );

    Promise.all(rejections).then(() => {
      localStorage.setItem('approvalResult', JSON.stringify({ status: 'rejected', time: Date.now() }));
      window.dispatchEvent(new Event('storage'));
      alert('Selected requests declined.');
      this.loadRequests();
    }).catch(err => alert('Error declining requests'));
  }

  archiveSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select request first.'); return; }
    this.requests = this.requests.filter(r => !r.selected);
    alert('Selected requests archived.');
  }

  deleteSelected() {
    const selected = this.requests.filter(r => r.selected);
    if (selected.length === 0) { alert('Select request first.'); return; }
    if (!confirm('Delete selected requests permanently?')) return;
    this.requests = this.requests.filter(r => !r.selected);
    alert('Selected requests deleted.');
  }

  get totalNotifications() { return this.notifications.length + this.requests.length; }
  get unreadCount() { return this.notifications.filter(n => n.status === 'Unread').length + this.requests.length; }
  get importantCount() { return this.notifications.filter(n => n.type === 'Notice' || n.type === 'Reminder').length; }
}