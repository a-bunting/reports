import { Component, OnInit } from '@angular/core';
import { DocumentReference } from '@angular/fire/firestore';
import { GroupsService, Student, Group } from 'src/app/services/groups.service';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { User } from 'src/app/utilities/authentication/user.model';

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
    groupDescription: string;
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

        this.groupService.addGroup(group).subscribe({
            next: (returnData: DocumentReference) => {
                console.log(`Success: ID ${returnData.id}`);
                this.groupId = returnData.id;
        },  error: (error) => {
                console.log(`Error: ${error.message}`);
        },  complete: () => {
                this.dataSubmitting = false;
        }})
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

        this.groupService.updateGroup(group, this.groupId).subscribe({
            next: () => {
                console.log(`Successfully modified data`);
                this.dataUpdated = true;
        },  error: (error) => {
                console.log(`Error: ${error.message}`);
        },  complete: () => {
                this.dataSubmitting = false;
                this.dataUpdating = false;
                this.dataChanged = false;
        }})
    }

    userInfo: string;
    separation: string = '\\t'; //default to tab separated...
    separationRegEx: RegExp = new RegExp(this.separation);

    setDataSeparation(sepIndicator: string): void {
        this.separation = sepIndicator;
        this.separationRegEx = new RegExp(''+sepIndicator);
    }

    generateUserData() {
        this.userDataGenerated = true;
        this.groupId = undefined;
        this.modifyData = false;
        let data: string[];

        data = this.userInfo.split("\n");
        
        // get data and split into individual elements
        let keys: string[] = [];
        
        // if there is a header row build a list of the keys to use for this dataset
        if(this.headerRow) {
            // keys = data[0].split(",").map((a: string) => a.trim());
            keys = data[0].split(this.separationRegEx).map((a: string) => a.trim());

            // check for duplicate key names and rename them...
            keys.forEach((key: string, index: number) => {
                let keyArray: string[] = [...keys];
                keyArray.splice(index, 1); // remove the tested value...
                let findIndex: number = keyArray.findIndex((t: string) => t === key);
                // test if it is a duplicate elsewhere...
                if(findIndex !== -1) { keys[index] = key + index; }
            })
            data.splice(0, 1);
        } else {
            // create a set of keys which is just numbers...
            // data[0].split(",").forEach(() => {
            data[0].split(this.separationRegEx).forEach(() => {
                keys.push(`Column ${keys.length + 1}`);
            })
        }

        // set keys globally to be accessed in the dom
        this.keys = keys;

        // iterate over the data and build a new array
        let newData = [];
        
        data.forEach((row: string) => {
            // let newUserData = row.split(",");
            let newUserData = row.split(this.separationRegEx);
            // [message, message]
            let user = { id: this.groupService.generateRandomId(), data: {} };

            // user a for loop to ensure even if a value is not defined it exists as a blank in the array
            for(let t = 0 ; t < keys.length ; t++) {
                const keyName: string = keys[t];
                const dataPoint: string = newUserData[t] ? newUserData[t] : "";
                user.data = { ...user.data, [keyName.trim()] : dataPoint.trim() };
            }
            // push to the newdata array
            newData.push(user);
        })

        this.userData = newData;
    }

    /**
     * Returns the position of a user within their group.
     * @param userId 
     */
    getIndexPositionById(userId: string): number {
        const index: number = this.userData.findIndex((temp: Student) => temp.id === userId);
        return index;
    }

    /**
     * Chnage a value for one of the users.
     * @param index 
     * @param key 
     * @param input 
     */
    userValueChange(userId: string, key: string, input: string) {
        const newValue = input.split("\n");
        const userIndex: number = this.getIndexPositionById(userId);

        if(userIndex !== -1) {
            this.userData[userIndex].data[key] = newValue[0];
            this.dataUpdated = false;
            this.dataChanged = true;
        }
    }

    /**
     * Remove a user
     * @param index 
     */
    removeUser(userId: string): void {
        const userIndex: number = this.getIndexPositionById(userId);

        if(userIndex !== -1) {
            this.userData.splice(userIndex, 1);
            this.dataUpdated = false;
            this.dataChanged = true;
        } else {
            console.log("Error, user not found...");
        }
    }

    /**
     * Chnage one of the column values - the titles.
     * This needs to change each of the values in each of the user entries too.
     * @param index 
     * @param input 
     */
    columnValueChange(index: number, input: FocusEvent | KeyboardEvent) {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newKeyArray: string[] = [...this.keys];
        const newValue: string[] = reference.innerText.split("\n");

        newKeyArray[index] = newValue[0];
        
        let newData: Student[] = [];
        
        // iterate over the data and build a new array
        this.userData.forEach((row: Student) => {
            let newDataUser: Student = { id: row.id, data: {} };
            // go through the array line by line changing the key values...
            this.keys.forEach((key: string, i: number) => {
                const newKey = { [(''+newKeyArray[`${i}`]).trim()] : row.data[`${key}`] }
                newDataUser = { id: newDataUser.id, data: {...newDataUser.data, ...newKey}};
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
        newData.forEach((row: Student) => {
            row.data[colName] = "";
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
        this.userData.forEach((row: Student) => {
            delete row.data[colName];
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

    sortDataForDisplay(data: {}): {} {
        let returnValue: {} = {};

        // sort the data into the same order as the keys.,..
        this.keys.forEach((key: string) => {
            const newKey: {} = { [''+key] : data[key] };
            returnValue = {...returnValue, ...newKey};
        })

        return returnValue;
    }

    modifyData: boolean = false;

    modifyGroupData(): void {
        this.modifyData = !this.modifyData;
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