import { Injectable } from '@angular/core';
import { DocumentReference, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { User } from '../utilities/authentication/user.model';
import { DatabaseService } from './database.service';

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

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {

    user: User;
    menuData: Subject<{id: string, name: string, deleted: boolean, created: boolean}> = new Subject<{id: undefined, name: undefined, deleted: undefined, created: undefined}>();
    templates: Template[] = [];

    constructor(private auth: AuthenticationService, private db: DatabaseService) { 
         // subscribe to the user details;
         auth.user.subscribe((user: User) => {
            this.user = user;
        });
    }

    /**
     * Get the best version of the templates and return it
     * (either from local storage or the database...)
     * @returns 
     */
    getTemplates(forcedFromDatabase: boolean = false): Observable<Template[]> {    
        this.templates = [];
        // check local sotrage first...
        if(localStorage.getItem('templates-data') !== null && forcedFromDatabase === false) {
            // retrieve the data from local storage and parse it into the templates data...
            this.templates = JSON.parse(localStorage.getItem('templates-data'));               
            // set the data on the display
            return of(this.templates).pipe(take(1), tap(returnData => {
                // return the data array...
                return returnData;
            }));
        } else {
            // no local sotrage available so retrieve from databse...
            return this.db.getTemplates().pipe(take(1), map((resultsArray: QuerySnapshot<any>) => {
                resultsArray.forEach((template: DocumentSnapshot<TemplateDB>) => {
                    let temp: TemplateDB = template.data();
                    let routes: [string[]] = [[]];
                    let id: string = template.id;
    
                    // split the routes up(entered into db as 123456|abcdef etc)
                    temp.template.forEach((route: string) => {
                        const routeIds: string[] = route.split("|");
                        routes.push(routeIds);
                    });
    
                    // build the new template data to use in the app
                    let newTemplate: Template = {
                        id: id,
                        name: temp.name,
                        public: temp.public,
                        characters: { min: temp.characters.min, max: temp.characters.max },
                        template: routes
                    };
    
                    // and add to the templayte object
                    this.templates.push(newTemplate);
                });
                // set the data into local storage to make it quicker ot retrieve next time...
                localStorage.setItem('templates-data', JSON.stringify(this.templates))
    
                return this.templates;
            }))
        }
    }

    /**
     * send a single template
     * @param id 
     * @returns 
     */
    getTemplate(id: string): Template {
        let index: number = this.templates.findIndex((temp: Template) => temp.id === id);
        return this.templates[index];
    }

    /**
     * When data changes emit the new data to anything that cares.
     * @param id 
     * @param name 
     * @param deleted 
     */
    dataChange(data: {id: string, name: string, deleted: boolean, created: boolean}): void {
        this.menuData.next(data);
    }

    /**
     * Adds a new template to the templates.
     * 
     * @param newTemplate 
     */
    addNewTemplate(newTemplate: TemplateDB, rawRoutes: [string[]]): Observable<DocumentReference> {
        // generate a new templatedb for the database...
        let tempDb: TemplateDB = {
            ...newTemplate, 
            manager: this.user.id, 
            template: this.parseTemplate(rawRoutes)
        }

        // return the databse update object
        return this.db.addTemplate(tempDb).pipe(take(1), tap((result: DocumentReference) => {
            let temp: Template = {
                ...newTemplate, 
                id: result.id, 
                template: rawRoutes
            }
            // add to the local array
            this.templates.push(temp);
             // update local storage - always happens...
            this.updateLocalStorage(this.templates);
        }));

    }

    /**
     * Updates a template of a specific id and then updates local storage...
     * @param template 
     * @param id 
     * @returns 
     */
    updateTemplate(template: Template): Observable<any> {
        // find the correct template using the id and update;
        let templateIndex: number = this.templates.findIndex(temp => temp.id === template.id);
        // found it so update local storage...
        if(templateIndex !== -1) {
            this.templates[templateIndex] = template;
            // always update local storage...
            this.updateLocalStorage(this.templates);
            // update the template database and return as an async thing ...
            return this.updateDatabase(template, template.id).pipe(take(1));
        }
    }

    /**
     * deletes a template from the database...
     * @param id 
     * @returns 
     */
    deleteTemplate(id: string): Observable<boolean> {
        return this.db.deleteTemplate(id).pipe(take(1), tap(() => {
            // success, find and remove from array
            let tempIndex = this.templates.findIndex((temp: Template) => temp.id === id);
            this.templates.splice(tempIndex, 1);
            // update local storage
            this.updateLocalStorage(this.templates);
            // return true to show its been deleted.
            return true;
        }, error => {
            console.log(`Error: ${error}`);
            return false;
        }))
    }

    /**
     * Updates the storage on the local machine - used to speed up the whole application
     * but essentially mirrors the database.
     * @param templates 
     */
    updateLocalStorage(templates: Template[]): void {
        localStorage.setItem('templates-data', JSON.stringify(templates));
    }

    /**
     * Update the database with new information.
     * @param template 
     * @param id 
     * @returns 
     */
    updateDatabase(template: Template, id: string): Observable<any> {
        // generate a new databse template format. only if templatw type passes is Template...
        let temp: TemplateDB = {
            name: template.name,
            public: template.public,
            characters: { min: template.characters.min, max: template.characters.max },
            template: this.parseTemplate(template.template),
            manager: this.user.id
        }

        // and update the database.
        return this.db.updateTemplate(temp, id).pipe(take(1), tap((result) => {
            // success...
            return true;
        }, error => {
            console.log(`Error updating database: ${error}`);
            return false;
        }))
    }

    /**
     * Takes a template from Template format (for use on the site) to TemplateDB format (for storage)
     * @param routes 
     * @returns 
     */
    parseTemplate(routes: [string[]]): string[] {
        // parse the template first
        let parsedTemplate: string[] = [];
        // iterate and put it in databaseformat.
        routes.forEach((template: string[]) => {
            let newTemplate: string = "";
            // concatenate the routes...
            template.forEach((temp: string, i: number) => {
                if(i !== 0) {
                    newTemplate += "|";
                }
                newTemplate += temp;
            })
            parsedTemplate.push(newTemplate);
        })
        return parsedTemplate;
    }

}
