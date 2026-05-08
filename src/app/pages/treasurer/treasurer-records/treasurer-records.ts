import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './treasurer-records.html',
  styleUrls: ['./treasurer-records.css']
})
export class Records implements OnInit {
  // ... keep all your existing code exactly the same
  searchId = '';
  records: any[] = [];
  filteredRecords: any[] = [];
  showAddForm = false;
  showTransactionForm = false;
  selectedRecord: any = null;
  selectedIndex = -1;
  feeMap: any = {
    "Organization fee": 100,
    "Usg Fee": 500,
    "Miscellaneous fee": 1000,
    "Tuition fee": 5000
  };
  newRecord: any = this.getEmptyRecord();
  newTransaction: any = this.getEmptyTransaction();

  ngOnInit() {
    const data = localStorage.getItem('records');
    this.records = data ? JSON.parse(data) : [];
    const uniqueMap = new Map();
    this.records.forEach((r: any) => {
      if (!uniqueMap.has(r.studentId)) {
        uniqueMap.set(r.studentId, r);
      } else {
        const existing = uniqueMap.get(r.studentId);
        existing.transactions = [...(existing.transactions || []), ...(r.transactions || [])];
      }
    });
    this.records = Array.from(uniqueMap.values());
    this.saveToStorage();
  }

  getEmptyRecord() {
    return { studentId: '', firstName: '', middleName: '', lastName: '', course: '', year: '', fee: '', amount: 0, method: '', balance: 0, status: '', date: '', receipt: '' };
  }

  getEmptyTransaction() {
    return { fee: '', amount: 0, method: '', balance: 0, status: '', date: '', receipt: '' };
  }

  saveToStorage() { localStorage.setItem('records', JSON.stringify(this.records)); }

  computeBalance(record: any) {
    const fee = this.feeMap[record.fee] || 0;
    let paid = Number(record.amount || 0);
    if (paid < 0) paid = 0;
    if (paid > fee) paid = fee;
    record.amount = paid;
    record.balance = fee - paid;
    record.status = record.balance === 0 ? 'Paid' : 'Partial';
  }

  onFileSelected(event: any, target: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => target.receipt = reader.result as string;
    reader.readAsDataURL(file);
  }

  searchStudent() {
    const key = this.searchId.trim();
    if (!key) { this.filteredRecords = []; return; }
    this.filteredRecords = this.records.filter(r => r.studentId.includes(key));
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
    const existing = this.records.find(r => String(r.studentId).trim().toLowerCase() === String(this.newRecord.studentId).trim().toLowerCase());
    if (existing) { alert("Student already exists!"); return; }
    this.computeBalance(this.newRecord);
    const student = {
      studentId: this.newRecord.studentId, firstName: this.newRecord.firstName,
      middleName: this.newRecord.middleName, lastName: this.newRecord.lastName,
      course: this.newRecord.course, year: this.newRecord.year,
      transactions: [{ fee: this.newRecord.fee, amount: this.newRecord.amount, method: this.newRecord.method, balance: this.newRecord.balance, status: this.newRecord.status, date: this.newRecord.date, receipt: this.newRecord.receipt }]
    };
    this.records.push(student);
    this.saveToStorage();
    window.dispatchEvent(new Event('storage'));
    alert("Student added successfully!");
    this.closeAddForm();
  }

  addTransaction() {
    const student = this.filteredRecords[0];
    if (!student) return;
    if (!this.newTransaction.fee) { alert("Fee is required!"); return; }
    if (!this.newTransaction.amount) { alert("Amount is required!"); return; }
    if (!this.newTransaction.method) { alert("Payment Method is required!"); return; }
    if (!this.newTransaction.date) { alert("Date is required!"); return; }
    this.computeBalance(this.newTransaction);
    student.transactions.push({ ...this.newTransaction });
    this.saveToStorage();
    window.dispatchEvent(new Event('storage'));
    alert("Transaction added successfully!");
    this.closeTransactionForm();
    this.searchStudent();
  }

  openAddForm() { this.showAddForm = true; this.showTransactionForm = false; this.selectedRecord = null; }
  closeAddForm() { this.showAddForm = false; this.newRecord = this.getEmptyRecord(); }
  openTransactionForm() {
    if (!this.filteredRecords.length) { alert("Search/select a student first."); return; }
    this.showTransactionForm = true; this.showAddForm = false; this.selectedRecord = null;
    this.newTransaction = this.getEmptyTransaction();
  }
  closeTransactionForm() { this.showTransactionForm = false; this.newTransaction = this.getEmptyTransaction(); }

  editRecord(record: any) {
    this.selectedRecord = { ...record };
    this.selectedIndex = this.records.findIndex(r => r.studentId === record.studentId);
    this.showAddForm = false; this.showTransactionForm = false;
  }

  saveEdit() {
    const duplicate = this.records.find((r, i) => i !== this.selectedIndex && r.studentId === this.selectedRecord.studentId);
    if (duplicate) { alert("Another student with this ID already exists!"); return; }
    if (this.selectedIndex > -1) {
      this.records[this.selectedIndex] = { ...this.records[this.selectedIndex], ...this.selectedRecord };
      this.saveToStorage();
      window.dispatchEvent(new Event('storage'));
      alert("Student updated successfully!");
      this.selectedRecord = null;
      this.searchStudent();
    }
  }

  cancelEdit() { this.selectedRecord = null; }

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
    return Object.values(feeTotals).map((f: any) => ({ fee: f.fee, balance: f.totalFee - f.paid })).filter((f: any) => f.balance > 0);
  }

  deleteTransaction(index: number) {
    const student = this.filteredRecords[0];
    if (!student) return;
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    student.transactions.splice(index, 1);
    this.saveToStorage();
    window.dispatchEvent(new Event('storage'));
    alert("Transaction deleted successfully!");
    this.searchStudent();
  }
}