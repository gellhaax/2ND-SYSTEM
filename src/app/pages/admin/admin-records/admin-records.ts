import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-records',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './admin-records.html',
  styleUrl: './admin-records.css'
})
export class AdminRecords implements OnInit {

  private apiUrl = 'http://localhost:3000/api';
  searchId = '';
  records: any[] = [];
  filteredRecords: any[] = [];
  selectedStudent: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadRecords(); }

  loadRecords() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.records = data;
        if (this.searchId) this.searchStudent();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  searchStudent() {
    const key = this.searchId.trim().toLowerCase();
    if (!key) { this.filteredRecords = []; return; }
    this.filteredRecords = this.records.filter(r =>
      r.studentId.toLowerCase().includes(key)
    );
  }

  viewStudent(student: any) { this.selectedStudent = student; }
  closeView() { this.selectedStudent = null; }

  deleteStudent(studentId: string) {
    if (!confirm("Are you sure you want to delete this student record?")) return;
    this.http.delete<any>(`${this.apiUrl}/students/${studentId}`).subscribe({
      next: () => {
        alert("Student record deleted successfully!");
        this.selectedStudent = null;
        this.loadRecords();
      },
      error: (err) => alert(err.error?.error || "Failed to delete student!")
    });
  }

  getAllStudents() { return this.searchId ? this.filteredRecords : this.records; }

  getTotalPaid(student: any): number {
    let total = 0;
    (student.transactions || []).forEach((t: any) => total += Number(t.amount || 0));
    return total;
  }

  getTotalBalance(student: any): number {
    let total = 0;
    (student.transactions || []).forEach((t: any) => total += Number(t.balance || 0));
    return total;
  }
}