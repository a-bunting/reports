import { Component, OnInit } from '@angular/core';
import { DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';
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

    constructor(private db: DatabaseService, private auth: AuthenticationService) { 
        auth.user.subscribe((user: User) => {
            this.user = user;
        })
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.db.getTemplates().pipe(take(1)).subscribe((templates: QuerySnapshot<any>) => {
            templates.forEach((template: DocumentSnapshot<TemplateDB>) => {
                let temp = template.data();
                let routes: [string[]] = [[]];

                // split the routes up(entered into db as 123456|abcdef etc)
                temp.template.forEach((route: string) => {
                    const routeIds: string[] = route.split("|");
                    routes.push(routeIds);
                })

                // build the new template data to use in the app
                let newTemplate: Template = {
                    id: template.id, 
                    name: temp.name,
                    public: temp.public,
                    characters: { min: temp.characters.min, max: temp.characters.max }, 
                    template: routes
                }

                // and add to the templayte object
                this.templates.push(newTemplate);                
            })
        }, error => {
            console.log(`Error: ${error.message}`);
        }, () => {
            this.isLoading = false;
        })
    }

}
