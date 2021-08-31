import { Component, OnInit } from '@angular/core';
import { Group } from '../classes/create-group/create-group.component';
import { GroupsService } from '../services/groups.service';
import { TemplatesService } from '../services/templates.service';
import { Template } from '../templates/templates.component';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

    groups: Group[] = [];
    loadedGroup: Group;

    templates: Template[] = [];

    constructor(private groupService: GroupsService, private templatesService: TemplatesService) { }

    ngOnInit(): void {
        this.loadGroups();
        this.loadTemplates();
    }

    // GROUPS FUNCTIONS
    loadGroups(): void {
        // get the groups database...
        this.groupService.getGroups().subscribe((result: Group[]) => {
            this.groups = result;
        })
    }

    loadGroup(groupId: string): void {
        console.log(groupId);
        // get the index
        let index: number = this.groups.findIndex((temp: Group) => temp.id === groupId);
        // and load...
        if(index !== -1) {
            this.loadedGroup = this.groups[index];
        }
    }

    loadTemplates(): void {
        // get the templates database...
        this.templatesService.getTemplates().subscribe((result: Template[]) => {
            this.templates = result;
        })
    }

}
