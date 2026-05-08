import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../treasurer-navbar/treasurer-navbar';

@Component({
  selector: 'app-treasurer-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './treasurer-contact.html',
  styleUrls: ['./treasurer-contact.css']
})
export class TreasurerContactComponent {}