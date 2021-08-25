import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {

    menuData: Subject<{id: string, name: string, deleted: boolean, created: boolean}> = new Subject<{id: undefined, name: undefined, deleted: undefined, created: undefined}>();

    constructor() { }

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
