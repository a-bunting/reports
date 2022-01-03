import { Injectable } from '@angular/core';
import { DocumentData, DocumentReference, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { DatabaseService } from './database.service';

export interface Group {
    name: string, id? : string, description?: string; keys: string[]; managers: string[], students: Student[]
}

export interface Student {
    id: string, data: {}
}

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
    getGroups(forcedFromDatabase: boolean = false, uid?: string): Observable<Group[]> {
        this.groups = [];
        // check if there is an instance of the groups database in localstorage...
        if(localStorage.getItem('groups-data') !== null && forcedFromDatabase === false) {
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
                        let newStudent: Student = { id: student.id, data: {} };
                        // arrange the keys by the keys array
                        newData.keys.forEach((key: string) => {
                            if(student.data[key]) {
                                newStudent.data[key] = student.data[key];
                            } else {
                                newStudent.data[key] = "";
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
                this.updateLocalStorage([...this.groups]);
                return this.groups;
            }))
        }
    }

    /**
     * Get an individual group
     * 
     * @param id 
     * @returns 
     */
    getGroup(id: string): Observable<Group> {
        return this.getGroups().pipe(take(1), map((groups: Group[]) => {
            this.groups = groups;
            // and then find the required file...
            let groupIndex: number = groups.findIndex((grp: Group) => grp.id === id);
            // if its an actual group return it...
            if(groupIndex !== -1) {
                return this.groups[groupIndex];
            }
        }));
    }

    /**
     * Adds a new group to the database.
     * @param newGroup 
     */
    addGroup(newGroup: Group): Observable<any> {
        // call the database...
        return this.db.createGroup(newGroup).pipe(take(1), tap({
            next: (res: DocumentReference) => {
                // add the id of the document to the group 
                newGroup.id = res.id;
                // add the new group to the groups array..
                this.groups.push(newGroup);
                // update the local storage
                this.updateLocalStorage([...this.groups]);
            }, 
            error: (error) => {
                console.log(`Error: ${error}`);
        }}))
    }

    /**
     * updates the data in a group...
     * @param group 
     * @param id 
     */
    updateGroup(group: Group, id: string): Observable<any> {
        // call the db
        return this.db.modifyGroup(group, id).pipe(take(1), tap({
            next: () => {
                // success...
                let index = this.groups.findIndex((grp: Group) => grp.id === id);
                // if found then update local storage
                if(index !== -1) {
                    this.groups[index] = { id: id, ...group};
                    this.updateLocalStorage([...this.groups]);
                }
        }, error: error => {
            console.log(`Error: ${error}`);
        }}))
    }

    /**
     * removes a group from the database...
     * @param id 
     */
    deleteGroup(id: string): Observable<Group[]> {
        // call the db
        return this.db.deleteGroup(id).pipe(take(1), tap({
            next: () => {
                // success
                let index = this.groups.findIndex((grp: Group) => grp.id === id);
                // if found then update local storage
                if(index !== -1) {
                    this.groups.splice(index, 1);
                    this.updateLocalStorage([...this.groups]);
                }
                console.log([...this.groups]);
                return [...this.groups];
        },  error: (error: any) => {
                console.log(`Error: ${error}`);
        }}))
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
     * Generate a new random ID...
     * DONE
     * @returns 
     */
     generateRandomId(): string {
        let newId: string = "";
        // get the characterset, length of character set and intended length of random ID.
        const characterset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const numberOfCharacters: number = characterset.length;
        const length: number = 5;   // 5 seems good, 62^5
        // generate a random number
        for(let i = 0; i < length; i++) {
            newId += characterset.charAt(Math.floor(Math.random() * numberOfCharacters));
        }
        return newId;
    }
}
