import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SearchComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor() { }

  selectedView: string = '';

  selectView(view: string) {
    this.selectedView = view;
  }


}
