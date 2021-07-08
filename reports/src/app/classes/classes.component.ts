import { Component, OnInit } from '@angular/core';
import { QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeAll, mergeMap, take, toArray } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';
import { Group } from './create-group/create-group.component';

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
            groups.forEach(grp => {
                console.log('done', grp.data());
            })
        });
    }

    getAllGroups(): Observable<any> {
        return this.db.getGroups().pipe(take(1));
    }

}
