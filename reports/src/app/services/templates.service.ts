import { Injectable } from '@angular/core';
import { DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Template, TemplateDB } from '../templates/templates.component';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {

    menuData: Subject<{id: string, name: string, deleted: boolean, created: boolean}> = new Subject<{id: undefined, name: undefined, deleted: undefined, created: undefined}>();

    constructor(private db: DatabaseService) { }

    /**
     * Get the best version of the templates and return it
     * (either from local storage or the database...)
     * @returns 
     */
    getTemplates(): Observable<Template[]> {
        let templates: Template[] = [];

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
                templates.push(newTemplate);
            });

            return templates;
        }))
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

}
