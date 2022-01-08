import { Component, OnInit } from '@angular/core';
import { CustomService } from '../services/custom.service';

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit {

    constructor(public customService: CustomService) {}

    ngOnInit(): void {
    }
}
