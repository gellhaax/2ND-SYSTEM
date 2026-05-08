import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-records',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  templateUrl: './admin-records.html',
  styleUrl: './admin-records.css'
})
export class AdminRecords implements OnInit {

  searchId = '';
  records: any[] = [];
  filteredRecords: any[] = [];
  selectedStudent: any = null;

  ngOnInit() {
    this.loadRecords();
    window.addEventListener('storage', () => this.loadRecords());
  }

  loadRecords() {
    const data = localStorage.getItem('records');
    this.records = data ? JSON.parse(data) : [];
    if (this.searchId) this.searchStudent();
  }

  searchStudent() {
    const key = this.searchId.trim().toLowerCase();
    if (!key) { this.filteredRecords = []; return; }
    this.filteredRecords = this.records.filter(r =>
      r.studentId.toLowerCase().includes(key)
    );
  }

  viewStudent(student: any) {
    this.selectedStudent = student;
  }

  closeView() {
    this.selectedStudent = null;
  }

  deleteStudent(studentId: string) {
    if (!confirm("Are you sure you want to delete this student record?")) return;
    this.records = this.records.filter(r => r.studentId !== studentId);
    localStorage.setItem('records', JSON.stringify(this.records));
    window.dispatchEvent(new Event('storage'));
    alert("Student record deleted successfully!");
    this.selectedStudent = null;
    this.searchStudent();
  }

  getAllStudents() {
    return this.searchId ? this.filteredRecords : this.records;
  }

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