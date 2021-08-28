import { Component, OnInit } from '@angular/core';
import { DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';
import { TemplatesService } from '../services/templates.service';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { User } from '../utilities/authentication/user.model';

export interface TemplateDB {
    manager: string; public: boolean; 
    name: string; characters: {min: number, max: number};
    template: string[]
}

export interface Template {
    id: string; public: boolean; 
    name: string; characters: {min: number, max: number};
    template: [string[]]
}

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss']
})
export class TemplatesComponent implements OnInit {

    templates: Template[] = [];
    user: User;
    isLoading: boolean = false;

    constructor(private db: DatabaseService, private templateService: TemplatesService, private auth: AuthenticationService) {
    }

    ngOnInit(): void {
        this.isLoading = true;
    
        this.auth.user.subscribe((user: User) => {
            this.user = user;
            // once the user is loaded then data can be retrived
            this.getTemplatesNew();
            // subscribe tot he templates service in case this is changed...
            this.templateService.menuData.subscribe((newData: {id: string, name: string, deleted: boolean, created: boolean}) => {
                const newId: any = this.templates.findIndex(element => element.id === newData.id);
                // if its new add it, if it was found then 
                if(newId !== -1) {
                    this.templateChanged(newData, newId);
                } else {
                    this.templateAdded(newData);
                }
            })
        }, error => {
            console.log(`Error: ${error.message}`);
            this.isLoading = false;
        })
    }

    // ADDED TO TEST AND NOT FULLY CONVERTED FROM OLD FUNCTION BELOW
    // DO THIS NOW ALEX :D
    getTemplatesNew(): void {
        this.templateService.getTemplates().subscribe(templates => {
            this.templates = templates;
            this.isLoading = false;
        })
    }

    /**
     * Get the templates already made by the user.
     */
    private getTemplates() {
        this.db.getTemplates().pipe(take(1)).subscribe((templates: QuerySnapshot<any>) => {
            templates.forEach((template: DocumentSnapshot<TemplateDB>) => {
                let temp = template.data();
                let routes: [string[]] = [[]];

                // split the routes up(entered into db as 123456|abcdef etc)
                temp.template.forEach((route: string) => {
                    const routeIds: string[] = route.split("|");
                    routes.push(routeIds);
                });

                // build the new template data to use in the app
                let newTemplate: Template = {
                    id: template.id,
                    name: temp.name,
                    public: temp.public,
                    characters: { min: temp.characters.min, max: temp.characters.max },
                    template: routes
                };

                // and add to the templayte object
                this.templates.push(newTemplate);
            });

            this.isLoading = false;
        }, error => {
            console.log(`Error: ${error.message}`);
            this.isLoading = false;
        })
    }

    templateChanged(data: {id: string, name: string, deleted: boolean, created: boolean}, index: number): void {
        // this.templates.forEach((template: Template, index: number) => {
        //     if(template.id === data.id) {
        //         // chnage the name...
        //         template.name = data.name;
        //         // remove if its been deleted;
        //         if(data.deleted) {
        //             this.templates.splice(index, 1);
        //         }
        //     }
        // })

        this.templates[index].name = data.name;

        if(data.deleted) {
            this.templates.splice(index, 1);
        }
    }

    templateAdded(data: {id: string, name: string, deleted: boolean, created: boolean}): void {
        let newTemplate: Template = {
            id: data.id, public: undefined, name: data.name, 
            characters: {min: undefined, max: undefined}, template: undefined 
        }
        this.templates.push(newTemplate);
    }
}
