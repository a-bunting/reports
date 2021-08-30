import { Component, OnInit } from '@angular/core';
import { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { GroupsService } from 'src/app/services/groups.service';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { User } from 'src/app/utilities/authentication/user.model';
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
    user: User;

    constructor(private groupsService: GroupsService, private auth: AuthenticationService, private groupService: GroupsService) { 
        // get the user info...
        auth.user.subscribe((user: User) => {
            this.user = user;
        })
    }

    ngOnInit(): void {
        this.loadGroups();
    }

    /**
     * load the groups database...
     */
    loadGroups(): void {
        this.isLoading = true;
        // subscribe to the load even in the group service which returns exactly one set of results.
        this.groupService.getGroups().subscribe((groups: Group[]) => {
            this.groups = groups;
            // set the updated fields to false;
            for(let i = 0 ; i < groups.length ; i++) {
                this.updatedData.push(false);
                this.updatingData.push(false);
            }
            // set it to loaded...
            this.loadingFailure = false;
            this.isLoading = false;
        }, (error) => {
            console.log(`Error loading groups: ${error.message}`);
            this.loadingFailure = true;
            this.isLoading = false;
        });
    }

    updatedData: boolean[] = [];
    updatingData: boolean[] = [];

    updateGroup(groupId: number): void {
        let group: Group = { 
            name: this.groups[groupId].name, 
            keys: this.groups[groupId].keys, 
            managers: this.groups[groupId].managers, 
            students: []
        };
        let students: Student[] = [];

        this.updatingData[groupId] = true;
        this.updatedData[groupId] = false;
        
        this.groups[groupId].students.forEach((student: Student) => {
            students.push(student);
        })
        
        group.students = students;
        
        this.groupsService.updateGroup(group, this.groups[groupId].id).subscribe(() => {
            console.log(`Successfully modified data`);
            this.updatedData[groupId] = false;
        }, (error) => {
            console.log(`Error: ${error.message}`);
            this.updatedData[groupId] = true; // data not updated...
        }, () => {
            this.updatingData[groupId] = false;
        })
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
        this.updatedData[groupId] = true;
        this.groups[groupId].students[index][key] = newValue[0];
    }

    /**
     * Add a user
     * @param groupId 
     */
    addUser(groupId: number): void {
        // new user template
        let newUserTemplate: Student = {};
        this.updatedData[groupId] = true;

        // add the keys to the new user in the right order...
        this.groups[groupId].keys.forEach((key: string) => {
            newUserTemplate[key] = "";
        })

        this.groups[groupId].students.push(newUserTemplate);
    }

    /**
     * Remove a user
     * @param index 
     */
    removeUser(groupId: number, index: number): void {
        this.updatedData[groupId] = true;
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
        this.updatedData[groupId] = true;
        
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
        this.updatedData[groupId] = true;

        // new data
        let newData = [...this.groups];

        // iterate over and add to each of the userdata...
        newData[groupId].students.forEach((row) => {
            row[colName] = "";
        });

        this.groups = newData;

        console.log(this.groups);
    }

    /**
     * removes a column
     * @param index 
     */
    deleteColumn(groupId: number, index: number): void {
        // strip from the keys array
        const colName: string = this.groups[groupId].keys[index];
        this.updatedData[groupId] = true;
        
        // and remove from each of the user data array
        this.groups[groupId].students.forEach(row => {
            delete row[colName];
        });
        
        this.groups[groupId].keys.splice(index, 1);
    }

    deletionConfirm: number = -1;
    deletingCurrent: boolean = false;

    deleteGroup(groupId: number): void {
        this.deletionConfirm = groupId;
    }

    deleteGroupClear(): void {
        this.deletionConfirm = -1;
    }

    /**
     * Deletes an entire group...
     * @param groupId 
     */
    deleteGroupConfirm(groupId: number): void {
        this.deletingCurrent = true;

        this.groupsService.deleteGroup(this.groups[groupId].id).subscribe(() => {
            console.log("deletion complete");
            this.groups.splice(groupId, 1);
        }, error => {
            console.log(`Error: ${error.message}`);
        }, () => {
            this.deletionConfirm = -1;
            this.deletingCurrent = false;
        })
    }

    /**
     * Checks to see if the name of the group hasbeen changed and adjusts the visiblity
     * of the button accoridnly.
     * @param groupId 
     * @param input 
     */
    checkNameChange(groupId: number, input: KeyboardEvent): void {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newValue = reference.innerText.split("\n");
        
        if(this.groups[groupId].name !== newValue[0]) {
            document.getElementById('nameButton' + groupId).style.display = "inline-block";
        } else {
            document.getElementById('nameButton' + groupId).style.display = "none";
        }
    }
    
    /**
     * Commits the name change to the group. Doesnt update the database...
     * @param groupId 
     */
    commitNameChange(groupId: number): void {
        // get the vaue and commit
        const newValue: string[] = document.getElementById('grpId' + groupId).innerText.split("\n");
        this.groups[groupId].name = newValue[0];
        // flag for db update
        this.updatedData[groupId] = true;
        // hide the save button
        document.getElementById('nameButton' + groupId).style.display = "none";
    }

    /**
     * keyvalue pipe orders alphabetically automatically. This stop that.
     * @returns number 0 
     */
    returnZero(): number {
        return 0;
    }

}
