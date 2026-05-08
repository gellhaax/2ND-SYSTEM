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

  ngOnInit() {
    this.loadData();
    window.addEventListener('storage', () => this.loadData());
  }

  loadData() {
    const data = localStorage.getItem('records');
    this.records = data ? JSON.parse(data) : [];
  }

  get totalCash(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'Cash') total += Number(t.amount || 0);
      });
    });
    return total;
  }

  get totalGCash(): number {
    let total = 0;
    this.records.forEach(student => {
      (student.transactions || []).forEach((t: any) => {
        if (t.method === 'GCash') total += Number(t.amount || 0);
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