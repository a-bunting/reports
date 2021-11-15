import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit {

    constructor(private titleService: Title) {}

    ngOnInit(): void {
        this.titleService.setTitle(`Reports - Classes`);
    }
}
