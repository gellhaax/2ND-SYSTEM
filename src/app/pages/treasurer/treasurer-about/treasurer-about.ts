import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './treasurer-about.html',
  styleUrls: ['./treasurer-about.css']
  
})
export class About {
  
  openFB(link: string) {
    window.open(link, '_blank');
  }

}