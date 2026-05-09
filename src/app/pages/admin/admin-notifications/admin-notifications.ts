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

  requests: any[] = [];

  ngOnInit(): void {
    this.loadRequests();

    // Auto refresh when localStorage changes
    window.addEventListener('storage', () => {
      this.loadRequests();
    });
  }

  // Load requests safely as ARRAY
  loadRequests() {
    const pending = JSON.parse(localStorage.getItem('pendingApproval') || '[]');

    this.requests = pending
      .filter((r: any) => r && r.id)
      .map((r: any) => ({
        ...r,
        selected: false
      }));
  }

  // Save requests back to storage
  saveRequests() {
    localStorage.setItem('pendingApproval', JSON.stringify(this.requests));
  }

  // Select all toggle
  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.requests.forEach(r => r.selected = checked);
  }

  // Check if all selected
  isAllSelected(): boolean {
    return this.requests.length > 0 &&
      this.requests.every(r => r.selected);
  }

  // APPROVE REQUESTS
  approveSelected() {

    const selected = this.requests.filter(r => r.selected);

    if (selected.length === 0) {
      alert('Select request first.');
      return;
    }

    let records = JSON.parse(localStorage.getItem('records') || '[]');

    selected.forEach(req => {

      // EDIT REQUEST
      if (req.type === 'edit') {
        const index = records.findIndex(
          (r: any) => r.studentId === req.studentId
        );

        if (index > -1) {
          records[index] = {
            ...records[index],
            ...req.data
          };
        }
      }

      // DELETE REQUEST
      else if (req.type === 'delete') {
        const student = records.find(
          (r: any) => r.studentId === req.studentId
        );

        if (student) {
          student.transactions.splice(req.transactionIndex, 1);
        }
      }

    });

    // Save updated records
    localStorage.setItem('records', JSON.stringify(records));

    // Send approval result to treasurer
    localStorage.setItem('approvalResult', JSON.stringify({
      status: 'approved',
      time: Date.now()
    }));

    // Remove processed requests
    this.requests = this.requests.filter(r => !r.selected);
    this.saveRequests();

    // Single refresh event only
    window.dispatchEvent(new Event('storage'));

    alert('Selected requests approved.');
  }

  // DECLINE REQUESTS
  declineSelected() {

    const selected = this.requests.filter(r => r.selected);

    if (selected.length === 0) {
      alert('Select request first.');
      return;
    }

    localStorage.setItem('approvalResult', JSON.stringify({
      status: 'rejected',
      time: Date.now()
    }));

    this.requests = this.requests.filter(r => !r.selected);
    this.saveRequests();

    window.dispatchEvent(new Event('storage'));

    alert('Selected requests declined.');
  }

  // ARCHIVE REQUESTS
  archiveSelected() {

    const selected = this.requests.filter(r => r.selected);

    if (selected.length === 0) {
      alert('Select request first.');
      return;
    }

    this.requests = this.requests.filter(r => !r.selected);
    this.saveRequests();

    window.dispatchEvent(new Event('storage'));

    alert('Selected requests archived.');
  }

  // DELETE REQUESTS
  deleteSelected() {

    const selected = this.requests.filter(r => r.selected);

    if (selected.length === 0) {
      alert('Select request first.');
      return;
    }

    const confirmDelete = confirm('Delete selected requests permanently?');
    if (!confirmDelete) return;

    this.requests = this.requests.filter(r => !r.selected);
    this.saveRequests();

    window.dispatchEvent(new Event('storage'));

    alert('Selected requests deleted.');
  }
}