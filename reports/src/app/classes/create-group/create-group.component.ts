import { Component, OnInit } from '@angular/core';
import { DocumentReference } from '@angular/fire/firestore';
import { GroupsService } from 'src/app/services/groups.service';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { User } from 'src/app/utilities/authentication/user.model';

export interface Group {
    name: string, id? : string, keys: string[]; managers: string[], students: Student[]
}

export interface Student {
}

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss']
})
export class CreateGroupComponent implements OnInit {

    headerRow: boolean = true;
    keys: string[];
    userData: Student[];
    user: User;
    groupname: string;
    userDataGenerated: boolean = false;
    dataSubmitting: boolean = false;
    dataUpdating: boolean = false; // data is currently being updated...
    dataUpdated: boolean = false; // data has been saved since updating (databe is up to dtae)
    dataChanged: boolean = false;
    groupId: string; // if the class has been created this will be populated with the database id.

    constructor(private groupService: GroupsService, private auth: AuthenticationService) { 
        auth.user.subscribe((user: User) => {
            this.user = user;
        })
    }

    ngOnInit(): void {
    }

    createGroup(): void {
        this.dataSubmitting = true;
        let group: Group = { name: this.groupname, keys: [], managers: [], students: []};
        let managers: string[] = [this.user.id];
        let students: Student[] = [];

        this.userData.forEach((student: Student) => {
            students.push(student);
        })

        group.managers = managers;
        group.students = students;
        group.keys = this.keys;

        this.groupService.addGroup(group).subscribe((returnData: DocumentReference) => {
            console.log(`Success: ID ${returnData.id}`);
            this.groupId = returnData.id;
        }, (error) => {
            console.log(`Error: ${error.message}`);
        }, () => {
            this.dataSubmitting = false;
        })
    }

    updateGroup(): void {
        this.dataSubmitting = true;
        this.dataUpdating = true;
        let group: Group = { name: this.groupname, keys: [], managers: [], students: []};
        let managers: string[] = [this.user.id];
        let students: Student[] = [];

        this.userData.forEach((student: Student) => {
            students.push(student);
        })

        group.managers = managers;
        group.students = students;
        group.keys = this.keys;

        this.groupService.updateGroup(group, this.groupId).subscribe(() => {
            console.log(`Successfully modified data`);
            this.dataUpdated = true;
        }, (error) => {
            console.log(`Error: ${error.message}`);
        }, () => {
            this.dataSubmitting = false;
            this.dataUpdating = false;
            this.dataChanged = false;
        })
    }

    generateUserData() {
        this.userDataGenerated = true;
        this.groupId = undefined;
        let data: string[];

        // for now use testdata if none exists in the textbox
        if(document.getElementById('groupInputBox').innerText === "") {
            // no test data in box, use variable testData
            data = testData.split("\n");
        } else {
            // testdata exists in the box
            data = document.getElementById('groupInputBox').innerText.split("\n");
        }

        // get data and split into individual elements
        let keys: string[] = [];
        
        // if there is a header row build a list of the keys to use for this dataset
        if(this.headerRow) {
            keys = data[0].split(",");
            data.splice(0, 1);
        } else {
            // create a set of keys which is just numbers...
            data[0].split(",").forEach(() => {
                keys.push(`Column ${keys.length + 1}`);
            })
        }

        // set keys globally to be accessed in the dom
        this.keys = keys;
        // iterate over the data and build a new array
        let newData = [];
        
        data.forEach((row: string) => {
            let newUserData = row.split(",");
            let user = {};

            // user a for loop to ensure even if a value is not defined it exists as a blank in the array
            for(let t = 0 ; t < keys.length ; t++) {
                const keyName: string = keys[t];
                const dataPoint = newUserData[t] ? newUserData[t] : "";
                user = { ...user, [keyName] : dataPoint };
            }
            // push to the newdata array
            newData.push(user);
        })

        this.userData = newData;
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
        this.userData[index][key] = newValue[0];
        this.dataUpdated = false;
        this.dataChanged = true;
    }

    /**
     * Remove a user
     * @param index 
     */
    removeUser(index: number): void {
        this.userData.splice(index, 1);
        this.dataUpdated = false;
        this.dataChanged = true;
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
        this.userData.forEach((row) => {
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
        this.userData = newData;
        this.dataUpdated = false;
        this.dataChanged = true;
    }

    /**
     * Adds a new column to the data - will name it col length...
     */
    addColumn(): void {
        // add to the keys...
        const colName = `Column ${this.keys.length + 1}`;
        this.keys.push(colName);

        // new data
        let newData = [...this.userData];

        // iterate over and add to each of the userdata...
        newData.forEach((row) => {
            row[colName] = "";
        });

        this.userData = newData;
        this.dataUpdated = false;
        this.dataChanged = true;
    }

    /**
     * removes a column
     * @param index 
     */
    deleteColumn(index: number): void {
        // strip from the keys array
        const colName: string = this.keys[index];
        
        // and remove from each of the user data array
        this.userData.forEach(row => {
            delete row[colName];
        });

        this.keys.splice(index, 1);
        this.dataUpdated = false;
        this.dataChanged = true;
    }

    /**
     * keyvalue pipe orders alphabetically automatically. This stop that.
     * @returns number 0 
     */
    returnZero(): number {
        return 0;
    }

}

let testData = 
`Forename,Surname,Nickname,Gender
Minerva,Dursley,Minerva,M
Cho,Santiago,Cho,M
Molly,Potter,Molly,M
George,Dursley,George,F
Ron,McGonagall,Ron,M
Hermione,Dursley,Hermione,F
Albus,,Albus,M
George,McGonagall,George,F
Ron,Santiago,Ron,M
Ginny,Weasley,,M
Charlie,Dursley,Charlie,M
Cho,Dumbledore,Cho,F
Hermione,Dursley,Hermione,M
Charlie,Boyle,Charlie,F`;