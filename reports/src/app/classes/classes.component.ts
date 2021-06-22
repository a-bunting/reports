import { Component, OnInit } from '@angular/core';
import { QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeAll, mergeMap, toArray } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';

export interface Group {
    name: string; managers: {name: string, email: string, uid: string}[]
}

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.scss']
})
export class ClassesComponent implements OnInit {

    groups: Group[];
    createNewGroup: boolean = false;

    // group database structure
    /*
    
    randomId: string
    {
        name: group name, 
        
    }
    
    */

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {
        this.getAllGroups().subscribe(all => console.log('done', all));
    }

    getAllGroups(): Observable<any> {
        return this.db.getGroups().pipe(
            // mergeAll(),
            // mergeMap((group: QueryDocumentSnapshot<any>) => {
            //     const managersInGroup = forkJoin(
            //         group.data().managers.map(userManager => {
            //             this.db.getUserName(userManager.uid).pipe(
            //                 map(userName => ({ ...userManager, name: userName}))
            //             )
            //         })
            //     );
            //     return managersInGroup.pipe(
            //         map(managersOfGroup => ({
            //             name: group.data().name,
            //             managers: managersOfGroup
            //         }))
            //     );
            // }), 
            // toArray() 
        );
    }

}
