import { Component, OnInit } from '@angular/core';
import { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeAll, mergeMap, take, toArray } from 'rxjs/operators';
import { DatabaseService } from '../../services/database.service';
import { Group } from '../create-group/create-group.component';

@Component({
  selector: 'app-edit-group',
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.scss']
})
export class EditGroupComponent implements OnInit {
    
    groups: Group[] = [];
    createNewGroup: boolean = false;
    isLoading: boolean = false;

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {
        this.isLoading = true;
        this.getAllGroups().subscribe((groups: QuerySnapshot<any>) => {
            groups.forEach((grp: DocumentSnapshot<Group>) => {
                this.groups.push(grp.data());
            })
        }, (error) => {
            console.log(`Error loading groups: ${error.message}`);
        }, () => {
            this.isLoading = false;
        });
    }

    getAllGroups(): Observable<any> {
        return this.db.getGroups().pipe(take(1));
    }

}
