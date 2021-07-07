import { Component, OnInit } from '@angular/core';
import { QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeAll, mergeMap, take, toArray } from 'rxjs/operators';
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

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {
        this.getAllGroups().subscribe((groups: QuerySnapshot<any>) => {
            console.log('done', groups.docs.values)
        });
    }

    getAllGroups(): Observable<any> {
        return this.db.getGroups().pipe(take(1));
    }

}
