import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-treasurer-notifications',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './treasurer-notifications.html',
  styleUrls: ['./treasurer-notifications.css']
})
export class TreasurerNotifications implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private refreshInterval: any;

  notifications: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadNotifications();

    // Auto-refresh every 5 seconds
    this.refreshInterval = setInterval(() => {
      this.loadNotifications();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  loadNotifications() {
    this.http.get<any[]>(`${this.apiUrl}/notifications/treasurer`).subscribe({
      next: (data) => {
        this.notifications = data.map(n => ({
          ...n,
          date: new Date(n.created_at).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          })
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading notifications:', err)
    });
  }

  markAsRead(notification: any) {
    if (notification.isRead) return;
    this.http.put(`${this.apiUrl}/notifications/${notification.id}/read`, {}).subscribe({
      next: () => {
        notification.isRead = 1;
        this.cdr.detectChanges();
      }
    });
  }

  get unreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }
}