import { Injectable } from '@angular/core';
import { DocumentData, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
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

  addGroup(newGroup: Group): void {
    this.groups.push(newGroup);
  }
}
