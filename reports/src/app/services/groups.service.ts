import { Injectable } from '@angular/core';
import { DocumentData, DocumentReference, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable, of, Subject } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { Group, Student } from '../classes/create-group/create-group.component';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})

export class GroupsService {

    groups: Group[] = [];

    constructor(private db: DatabaseService) { }

    /**
    * Get the best version of the groups and return it
    * (either from local storage or the database...)
    * @returns 
   */
    getGroups(): Observable<Group[]> {
        this.groups = [];
        // check if there is an instance of the groups database in localstorage...
        if(localStorage.getItem('groups-data') !== null) {
            // retrieve the data from local storage and parse it into the templates data...
            this.groups = JSON.parse(localStorage.getItem('groups-data'));               
            // set the data on the display
            return of(this.groups).pipe(take(1), tap(returnData => {
                // return the data array...
                return returnData;
            }));      
        } else {
            // need to retrive the data from the database...
            return this.db.getGroups().pipe(take(1), map((returnData: QuerySnapshot<any>) => {
                // Iterate through the groups to see up the group data.
                returnData.forEach((grp: DocumentData) => {
                    let newData: Group = grp.data();
                    let orderedStudents: Student[] = [];
                    newData['id'] = grp.id;
    
                    // rearrange the student data to have the same order of keys as the newData.keys array
                    newData.students.forEach((student: Student) => {
                        let newStudent: Student = {};
                        // arrange the keys by the keys array
                        newData.keys.forEach((key: string) => {
                            if(student[key]) {
                                newStudent[key] = student[key];
                            } else {
                                newStudent[key] = "";
                            }
                        })
                        // add the new student to the array
                        orderedStudents.push(newStudent);
                    })
                    // push to the group data
                    newData.students = orderedStudents;
                    this.groups.push(newData);
                })
                // set the data into local storage to make it quicker ot retrieve next time...
                localStorage.setItem('groups-data', JSON.stringify(this.groups))

                return this.groups;
            }))
        }
    }

    /**
     * Adds a new group to the database.
     * @param newGroup 
     */
    addGroup(newGroup: Group): Observable<any> {
        // call the database...
        return this.db.createGroup(newGroup).pipe(take(1), tap((res: DocumentReference) => {
            // add the id of the document to the group 
            newGroup.id = res.id;
            // add the new group to the groups array..
            this.groups.push(newGroup);
            // update the local storage
            this.updateLocalStorage(this.groups);
        }, error => {
            console.log(`Error: ${error}`);
        }))
    }

    /**
     * updates the data in a group...
     * @param group 
     * @param id 
     */
    updateGroup(group: Group, id: string): Observable<any> {
        // call the db
        console.log(id, group);
        return this.db.modifyGroup(group, id).pipe(take(1), tap((res) => {
            // success...
            let index = this.groups.findIndex((grp: Group) => grp.id === id);
            // if found then update local storage
            if(index !== -1) {
                this.groups[index] = group;
                this.updateLocalStorage(this.groups);
            }
        }, error => {
            console.log(`Error: ${error}`);
        }))
    }

    /**
     * removes a group from the database...
     * @param id 
     */
    deleteGroup(id: string): Observable<any> {
        // call the db
        return this.db.deleteGroup(id).pipe(take(1), tap((res) => {
            // success
            let index = this.groups.findIndex((grp: Group) => grp.id === id);
            // if found then update local storage
            if(index !== -1) {
                this.groups.splice(index, 1);
                this.updateLocalStorage(this.groups);
            }
        }, error => {
            console.log(`Error: ${error}`);
        }))
    }

    /**
     * Updates the storage on the local machine - used to speed up the whole application
     * but essentially mirrors the database.
     * @param templates 
     */
    updateLocalStorage(groups: Group[]): void {
        localStorage.setItem('groups-data', JSON.stringify(groups));
    }

    /**
     * Update the database with new information.
     * @param template 
     * @param id 
     * @returns 
     */
     updateDatabase(group: Group, id: string): Observable<any> {
        // update the database.
        return this.db.modifyGroup(group, id).pipe(take(1), tap((result) => {
            // success...
            return true;
        }, error => {
            console.log(`Error updating database: ${error}`);
            return false;
        }))
    }
}