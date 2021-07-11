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
            let keys: string[] = [];

            groups.forEach((grp: DocumentSnapshot<Group>) => {
                let newData = grp.data();
                newData['id'] = grp.id;

                // iterate through each of the keys...
                Object.keys(grp).forEach((key: string) => {
                    // fill the keys array without duplicates...

                })

                this.groups.push(newData);
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

    /**
     * Chnage a value for one of the users.
     * @param index 
     * @param key 
     * @param input 
     */
     userValueChange(index: number, key: string, input: FocusEvent | KeyboardEvent) {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newValue = reference.innerText.split("\n");
        this.groups[index][key] = newValue[0];
    }

    /**
     * Remove a user
     * @param index 
     */
    removeUser(index: number): void {
        this.groups.splice(index, 1);
    }

    /**
     * Chnage one of the column values - the titles.
     * This needs to change each of the values in each of the user entries too.
     * @param index 
     * @param input 
     */
    columnValueChange(index: number, input: FocusEvent | KeyboardEvent) {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newKeyArray = [...this.keys];
        const newValue = reference.innerText.split("\n");

        newKeyArray[index] = newValue[0];
        
        let newData = [];
        
        // iterate over the data and build a new array
        this.groups.forEach((row) => {
            let newDataUser = {};
            // go through the array line by line changing the key values...
            this.keys.forEach((key: string, i: number) => {
                const newKey = { [newKeyArray[`${i}`]] : row[`${key}`] }
                newDataUser = {...newDataUser, ...newKey};
            })

            // add ot the new array
            newData.push(newDataUser);
        })

        this.keys = newKeyArray;
        this.groups = newData;
    }

    /**
     * Adds a new column to the data - will name it col length...
     */
    addColumn(): void {
        // add to the keys...
        const colName = `Column ${this.keys.length + 1}`;
        this.keys.push(colName);

        // new data
        let newData = [...this.groups];

        // iterate over and add to each of the userdata...
        newData.forEach((row) => {
            row[colName] = "";
        });

        this.groups = newData;
    }

    /**
     * removes a column
     * @param index 
     */
    deleteColumn(index: number): void {
        // strip from the keys array
        const colName: string = this.keys[index];
        
        // and remove from each of the user data array
        this.groups.forEach(row => {
            delete row[colName];
        });

        this.keys.splice(index, 1);
    }

    /**
     * keyvalue pipe orders alphabetically automatically. This stop that.
     * @returns number 0 
     */
    returnZero(): number {
        return 0;
    }

}
