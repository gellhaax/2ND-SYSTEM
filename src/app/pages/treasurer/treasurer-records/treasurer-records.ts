import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './treasurer-records.html',
  styleUrls: ['./treasurer-records.css']
})
export class Records implements OnInit, OnDestroy {

  private apiUrl = 'http://localhost:3000/api';
  private routerSub!: Subscription;

  searchId = '';
  records: any[] = [];
  filteredRecords: any[] = [];
  showAddForm = false;
  showTransactionForm = false;
  selectedRecord: any = null;
  selectedIndex = -1;
  pendingApproval: any = null;

  feeMap: any = {
    "Organization fee": 100,
    "Usg Fee": 500,
    "Miscellaneous fee": 1000,
    "Tuition fee": 5000
  };

  newRecord: any = this.getEmptyRecord();
  newTransaction: any = this.getEmptyTransaction();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef  // ✅ ADD THIS
  ) {}

  ngOnInit() {
    this.loadRecords();

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadRecords();
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  loadRecords() {
    this.http.get<any[]>(`${this.apiUrl}/students`).subscribe({
      next: (data) => {
        this.records = data;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE
      },
      error: (err) => console.error('Error loading records:', err)
    });
  }

  getEmptyRecord() {
    return {
      studentId: '', firstName: '', middleName: '', lastName: '',
      course: '', year: '', fee: '', amount: 0, method: '',
      balance: 0, status: '', date: '', receipt: ''
    };
  }

  getEmptyTransaction() {
    return {
      fee: '', amount: 0, method: '', balance: 0,
      status: '', date: '', receipt: ''
    };
  }

  computeBalance(record: any) {
    const fee = this.feeMap[record.fee] || 0;
    let paid = Number(record.amount || 0);
    if (paid < 0) paid = 0;
    if (paid > fee) paid = fee;
    record.amount = paid;
    record.balance = fee - paid;
    record.status = record.balance === 0 ? 'Paid' : 'Partial';
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  onFileSelected(event: any, target: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      target.receipt = reader.result as string;
      this.cdr.detectChanges(); // ✅ FORCE UPDATE
    };
    reader.readAsDataURL(file);
  }

  searchStudent() {
    const key = this.searchId.trim();
    if (!key) {
      this.filteredRecords = [];
      this.cdr.detectChanges(); // ✅ FORCE UPDATE
      return;
    }
    this.filteredRecords = this.records.filter(r => r.studentId.includes(key));
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  addRecord() {
    if (!this.newRecord.studentId?.trim()) { alert("Student ID is required!"); return; }
    if (!this.newRecord.firstName?.trim()) { alert("First Name is required!"); return; }
    if (!this.newRecord.lastName?.trim()) { alert("Last Name is required!"); return; }
    if (!this.newRecord.course) { alert("Course is required!"); return; }
    if (!this.newRecord.year) { alert("Year is required!"); return; }
    if (!this.newRecord.fee) { alert("Fee is required!"); return; }
    if (!this.newRecord.amount) { alert("Amount is required!"); return; }
    if (!this.newRecord.method) { alert("Payment Method is required!"); return; }
    if (!this.newRecord.date) { alert("Date is required!"); return; }

    this.computeBalance(this.newRecord);

    const student = {
      studentId: this.newRecord.studentId,
      firstName: this.newRecord.firstName,
      middleName: this.newRecord.middleName,
      lastName: this.newRecord.lastName,
      course: this.newRecord.course,
      year: this.newRecord.year,
      transactions: [{
        fee: this.newRecord.fee,
        amount: this.newRecord.amount,
        method: this.newRecord.method,
        balance: this.newRecord.balance,
        status: this.newRecord.status,
        date: this.newRecord.date,
        receipt: this.newRecord.receipt
      }]
    };

    this.http.post<any>(`${this.apiUrl}/students`, student).subscribe({
      next: () => {
        alert("Student added successfully!");
        this.loadRecords();
        this.closeAddForm();
        this.cdr.detectChanges(); // ✅ FORCE UPDATE
      },
      error: (err) => alert(err.error?.error || "Failed to add student!")
    });
  }

  addTransaction() {
    const student = this.filteredRecords[0];
    if (!student) return;
    if (!this.newTransaction.fee) { alert("Fee is required!"); return; }
    if (!this.newTransaction.amount) { alert("Amount is required!"); return; }
    if (!this.newTransaction.method) { alert("Payment Method is required!"); return; }
    if (!this.newTransaction.date) { alert("Date is required!"); return; }

    this.computeBalance(this.newTransaction);

    this.http.post<any>(`${this.apiUrl}/transactions`, {
      studentId: student.studentId,
      ...this.newTransaction
    }).subscribe({
      next: () => {
        alert("Transaction added successfully!");
        this.loadRecords();
        this.closeTransactionForm();
        this.searchStudent();
        this.cdr.detectChanges(); // ✅ FORCE UPDATE
      },
      error: (err) => alert(err.error?.error || "Failed to add transaction!")
    });
  }

  openAddForm() {
    this.showAddForm = true;
    this.showTransactionForm = false;
    this.selectedRecord = null;
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  closeAddForm() {
    this.showAddForm = false;
    this.newRecord = this.getEmptyRecord();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  openTransactionForm() {
    if (!this.filteredRecords.length) { alert("Search/select a student first."); return; }
    this.showTransactionForm = true;
    this.showAddForm = false;
    this.selectedRecord = null;
    this.newTransaction = this.getEmptyTransaction();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  closeTransactionForm() {
    this.showTransactionForm = false;
    this.newTransaction = this.getEmptyTransaction();
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  editRecord(record: any) {
    this.selectedRecord = { ...record };
    this.selectedIndex = this.records.findIndex(r => r.studentId === record.studentId);
    this.showAddForm = false;
    this.showTransactionForm = false;
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  saveEdit() {
    if (!this.selectedRecord) { alert("No record selected for editing."); return; }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const approvalData = {
      requestedBy: currentUser.username || 'Treasurer',
      studentId: this.selectedRecord.studentId,
      studentName: `${this.selectedRecord.firstName} ${this.selectedRecord.lastName}`,
      requestedData: this.selectedRecord,
      originalData: this.records[this.selectedIndex]
    };

    this.http.post<any>(`${this.apiUrl}/approvals`, approvalData).subscribe({
      next: () => {
        alert("Edit request sent to Admin for approval. Please wait.");
        this.selectedRecord = null;
        this.selectedIndex = -1;
        this.cdr.detectChanges(); // ✅ FORCE UPDATE
      },
      error: (err) => alert(err.error?.error || "Failed to send approval request!")
    });
  }

  cancelEdit() {
    this.selectedRecord = null;
    this.cdr.detectChanges(); // ✅ FORCE UPDATE
  }

  getUniqueStudents() {
    const map = new Map();
    this.records.forEach(r => { if (!map.has(r.studentId)) map.set(r.studentId, r); });
    return Array.from(map.values());
  }

  getRemainingBalances(student: any) {
    if (!student || !student.transactions) return [];
    const feeTotals: any = {};
    student.transactions.forEach((t: any) => {
      const feeAmount = this.feeMap[t.fee] || 0;
      if (!feeTotals[t.fee]) feeTotals[t.fee] = { fee: t.fee, totalFee: feeAmount, paid: 0 };
      feeTotals[t.fee].paid += Number(t.amount || 0);
    });
    return Object.values(feeTotals)
      .map((f: any) => ({ fee: f.fee, balance: f.totalFee - f.paid }))
      .filter((f: any) => f.balance > 0);
  }

  deleteTransaction(index: number) {
    const student = this.filteredRecords[0];
    if (!student) return;
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    const transaction = student.transactions[index];
    if (!transaction?.id) { alert("Transaction ID not found!"); return; }

    this.http.delete<any>(`${this.apiUrl}/transactions/${transaction.id}`).subscribe({
      next: () => {
        alert("Transaction deleted successfully!");
        this.loadRecords();
        this.searchStudent();
        this.cdr.detectChanges(); // ✅ FORCE UPDATE
      },
      error: (err) => alert(err.error?.error || "Failed to delete transaction!")
    });
  }
}