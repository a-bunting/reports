import { Injectable } from '@angular/core';
import { DocumentData, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Group, Student } from '../classes/create-group/create-group.component';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})

export class GroupsService {

  constructor(private db: DatabaseService) { }

  /**
    * Get the best version of the groups and return it
    * (either from local storage or the database...)
    * @returns 
   */
  getGroups(): Observable<Group[]> {
        let groups: Group[] = [];

        // check if there is an instance of the groups database in localstorage...
        if(localStorage.getItem('groups-data') !== null) {
        
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
                    groups.push(newData);
                })
    
                return groups;
            }))
        }

  } 
}
