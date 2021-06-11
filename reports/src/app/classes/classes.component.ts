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
                
                // define the variables for the groups
                let newGroup: Group = {name: group.data().name, managers: null};
                let groupManagers: {name: string, email: string, uid: string}[] = [];

                // create the empty array for the observables for each user query
                let obsArray: Observable<any>[] = [];

                // for each user reference get an observable reference to the data
                group.data().managers.forEach(user => {
                    obsArray.push(this.db.getUserName(user.id));
                });

                // use concat to execute all subscriptions at once
                concat(obsArray).subscribe(data => {
                    // log the output of the observable 
                    console.log(data);
                });

                // add these values to the group variables
                newGroup.managers = groupManagers;
                newListOfGroups.push(newGroup);
            })
            
            // make the groups list the global list and repopulate the screen
            this.groups = newListOfGroups;

        }, (error: any) => {
            // standard error...
            console.log(`Error loading groups: ${error.message}`);
        }));
    }

}
