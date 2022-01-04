import { Component, OnInit } from '@angular/core';
import { Template, TemplatesService } from '../services/templates.service';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { User } from '../utilities/authentication/user.model';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {

    templates: Template[] = [];
    user: User;
    isLoading: boolean = false;

    constructor(private templateService: TemplatesService, private auth: AuthenticationService) {}

    ngOnInit(): void {
        this.isLoading = true;
    
        // get the user details and then the templates when this has loaded...
        this.auth.user.subscribe({
            next:
                (user: User) => {
                this.user = user;
                // once the user is loaded then data can be retrived
        },  error: (error) => {
                console.log(`Error: ${error.message}`);
                this.isLoading = false;
        }})

        this.getTemplates();

        // subscribe to the templates service in case this is changed...    
        this.templateService.menuData.subscribe({
            next: (newData: {id: string, name: string, deleted: boolean, created: boolean}) => {
                const newId: number = this.templates.findIndex((element: Template) => element.id === newData.id);
                
                // if its new add it, if it was found then 
                if(newId !== -1) {
                    this.templateChanged(newData, newId);
                } else {
                    // this.templateAdded(newData);
                    console.log("loading here TWICE");
                    this.getTemplates();
                }
        },  error: (error) => {
                console.log(`Error: ${error.message}`);
        }})

    }

    /**
     * Get the templates from the database...
     */
    getTemplates(): void {
        this.templateService.getTemplates().subscribe({
            next: (templates) => {
                this.templates = templates;
                this.isLoading = false;
        },  error: (error) => {
                console.log(`Error: ${error.message}`);
                this.isLoading = false;
        }})
    }

    templateChanged(data: {id: string, name: string, deleted: boolean, created: boolean}, index: number): void {
        this.templates[index].name = data.name;

        if(data.deleted) {
            this.templates.splice(index, 1);
        }
    }

    // deprecated...
    // templateAdded(data: {id: string, name: string, deleted: boolean, created: boolean}): void {
    //     let newTemplate: Template = {
    //         id: data.id, public: undefined, name: data.name, 
    //         characters: {min: undefined, max: undefined}, template: undefined 
    //     }
    //     this.templates.push(newTemplate);
    // }
}
