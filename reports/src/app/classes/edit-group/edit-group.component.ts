import { Component, OnInit } from '@angular/core';
import { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { forkJoin, Observable } from 'rxjs';
import { map, mergeAll, mergeMap, take, toArray } from 'rxjs/operators';
import { DatabaseService } from '../../services/database.service';
import { Group, Student } from '../create-group/create-group.component';

@Component({
  selector: 'app-edit-group',
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.scss']
})
export class EditGroupComponent implements OnInit {
    
    groups: Group[] = [];
    createNewGroup: boolean = false;
    isLoading: boolean = false;
    loadingFailure: boolean = false;

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {
        this.loadGroups();
    }

    // TO DO
    // IN CREATE GROUP ADD THE KEYS TO THE DATABASE IN THE ORDER THEY ARE DISPLAYED
    // THEN USE THEM AS THE ORDER IN THIS WHEN DISPLAYING...

    loadGroups(): void {
        this.isLoading = true;
        this.getAllGroups().subscribe((groups: QuerySnapshot<any>) => {
            // Iterate through the groups to see up the group data.
            groups.forEach((grp: DocumentSnapshot<Group>) => {
                let newData = grp.data();
                let orderedStudents: Student[] = [];
                newData['id'] = grp.id;

                // rearrange the student data to have the same order of keys as the newData.keys array
                newData.students.forEach((student: Student) => {
                    let newStudent: Student = {};

                    newData.keys.forEach((key: string) => {
                        newStudent[key] = student[key];
                    })

                    orderedStudents.push(newStudent);
                    console.log(student);
                })

                newData.students = orderedStudents;
                this.groups.push(newData);
                console.log(newData);
            })
            

        }, (error) => {
            console.log(`Error loading groups: ${error.message}`);
            this.loadingFailure = true;
            this.isLoading = false;
        }, () => {
            this.loadingFailure = false;
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
     userValueChange(groupId: number, index: number, key: string, input: FocusEvent | KeyboardEvent) {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newValue = reference.innerText.split("\n");
        this.groups[index][key] = newValue[0];
    }

    /**
     * Remove a user
     * @param index 
     */
    removeUser(groupId: number, index: number): void {
        this.groups[groupId].students.splice(index, 1);
    }

    /**
     * Chnage one of the column values - the titles.
     * This needs to change each of the values in each of the user entries too.
     * @param index 
     * @param input 
     */
    columnValueChange(groupId: number, index: number, input: FocusEvent | KeyboardEvent) {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newKeyArray = [...this.groups[groupId].keys];
        const newValue = reference.innerText.split("\n");

        newKeyArray[index] = newValue[0];
        
        let newData = [];
        
        // iterate over the data and build a new array
        this.groups[groupId].students.forEach((row) => {
            let newDataUser = {};
            // go through the array line by line changing the key values...
            this.groups[groupId].keys.forEach((key: string, i: number) => {
                const newKey = { [newKeyArray[`${i}`]] : row[`${key}`] }
                newDataUser = {...newDataUser, ...newKey};
            })

            // add ot the new array
            newData.push(newDataUser);
        })

        this.groups[groupId].keys = newKeyArray;
        this.groups[groupId].students = newData;
    }

    /**
     * Adds a new column to the data - will name it col length...
     */
    addColumn(groupId: number): void {
        // add to the keys...
        const colName = `Column ${this.groups[groupId].keys.length + 1}`;
        this.groups[groupId].keys.push(colName);

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
    deleteColumn(groupId: number, index: number): void {
        // strip from the keys array
        const colName: string = this.groups[groupId].keys[index];
        
        // and remove from each of the user data array
        this.groups.forEach(row => {
            delete row[colName];
        });
        
        this.groups[groupId].keys.splice(index, 1);
    }

    /**
     * keyvalue pipe orders alphabetically automatically. This stop that.
     * @returns number 0 
     */
    returnZero(): number {
        return 0;
    }

}
