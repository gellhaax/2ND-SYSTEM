import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { AdminNavbarComponent } from '../admin-navbar/admin-navbar';

@Component({
  selector: 'app-admin-records',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminNavbarComponent
  ],
  templateUrl: './admin-records.html',
  styleUrl: './admin-records.css'
})

export class AdminRecords implements OnInit {

  private apiUrl = 'http://localhost:3000/api';

  searchId = '';

  records: any[] = [];

  displayedRecords: any[] = [];

  selectedStudent: any = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {

    this.http
      .get<any[]>(`${this.apiUrl}/students`)
      .subscribe({

        next: (data) => {

          console.log('API DATA:', data);

          this.records = data || [];

          this.displayedRecords = [...this.records];

          // FORCE REFRESH
          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('ERROR LOADING RECORDS:', err);
        }
      });
  }

  searchStudent() {

    const key =
      this.searchId
        .trim()
        .toLowerCase();

    if (!key) {

      this.displayedRecords =
        [...this.records];

      return;
    }

    this.displayedRecords =
      this.records.filter((r: any) =>

        String(r.studentId)
          .toLowerCase()
          .includes(key)

      );
  }

  viewStudent(student: any) {
    this.selectedStudent = student;
  }

  closeView() {
    this.selectedStudent = null;
  }

  deleteStudent(studentId: string) {

    const confirmDelete = confirm(
      'Are you sure you want to delete this student record?'
    );

    if (!confirmDelete) return;

    this.http
      .delete<any>(
        `${this.apiUrl}/students/${studentId}`
      )
      .subscribe({

        next: () => {

          alert(
            'Student record deleted successfully!'
          );

          this.selectedStudent = null;

          this.loadRecords();
        },

        error: (err) => {

          console.error(err);

          alert(
            err.error?.error ||
            'Failed to delete student!'
          );
        }
      });
  }

  getTotalPaid(student: any): number {

    let total = 0;

    (student.transactions || [])
      .forEach((t: any) => {

        total += Number(
          t.amount || 0
        );

      });

    return total;
  }

  getTotalBalance(student: any): number {

    let total = 0;

    (student.transactions || [])
      .forEach((t: any) => {

        total += Number(
          t.balance || 0
        );

      });

    return total;
  }
}