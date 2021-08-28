import { Component, OnInit } from '@angular/core';
import { Group } from '../classes/create-group/create-group.component';
import { GroupsService } from '../services/groups.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

    constructor(private groupService: GroupsService) { }

    ngOnInit(): void {
        this.loadGroups();
    }

    groups: Group[] = [];

    loadGroups(): void {
        // get the groups database...
        this.groupService.getGroups().subscribe((result: Group[]) => {
            this.groups = result;
            console.log(result);
        })
    }

}
