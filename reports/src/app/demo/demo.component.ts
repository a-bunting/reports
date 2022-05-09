import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {

  openMenu: string = "";

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * Sets which menu is open
   * @param number
   */
  setOpenMenu(str: string): void { this.openMenu = this.openMenu === str ? '' : str }

}
