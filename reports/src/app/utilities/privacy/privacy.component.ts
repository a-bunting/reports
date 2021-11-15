import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss']
})
export class PrivacyComponent implements OnInit {

  constructor(private titleService: Title) { }

  ngOnInit(): void {
      if(window.location.pathname === "/privacy") {
          this.titleService.setTitle(`Reports - Privacy Policy`);
      }
  }

}
