import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-modify-user-data',
  templateUrl: './modify-user-data.component.html',
  styleUrls: ['./modify-user-data.component.scss']
})
export class ModifyUserDataComponent implements OnInit {

    constructor(private activatedRoute: ActivatedRoute) { }

    mode: string;

    ngOnInit(): void {
        this.mode = this.activatedRoute.snapshot.queryParams['mode'];
    }

}
