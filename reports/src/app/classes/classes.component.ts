import { Component, OnInit } from '@angular/core';
import { QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { concat, merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {

        const groups = this.getAllGroups();

        groups.subscribe(() => {
            console.log(JSON.stringify(this.groups));
        })

    }

    getAllGroups(): Observable<any> {
        let newListOfGroups: Group[] = [];

        return this.db.getGroups().pipe(map((groups: QuerySnapshot<any>) => {
            groups.forEach((group: QueryDocumentSnapshot<any>) => {
                
                let newGroup: Group = {name: group.data().name, managers: null};
                let groupManagers: {name: string, email: string, uid: string}[] = [];

                let obsArray: Observable<any>[] = [];

                group.data().managers.forEach(user => {
                    obsArray.push(this.db.getUserName(user.id));
                });

                // concat(obsArray).subscribe((userResult: Observable<any>) => {
                //     groupManagers.push({name: userResult.data().name, email: userResult.data().email, uid: userResult.id});
                // });
                concat(obsArray).subscribe(console.log);

                newGroup.managers = groupManagers;
                newListOfGroups.push(newGroup);
            })
            
            this.groups = newListOfGroups;

        }, (error: any) => {
            console.log(`Error loading groups: ${error.message}`);
        }));
    }

}
