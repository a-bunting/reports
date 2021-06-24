import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss']
})
export class CreateGroupComponent implements OnInit {

    headerRow: boolean = true;
    keys: string[];
    userData;

    constructor() { }

    ngOnInit(): void {
    }

    generateUserData() {
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
    }

    /**
     * Remove a user
     * @param index 
     */
    removeUser(index: number): void {
        this.userData.splice(index, 1);
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
    }

    deleteColumn(index: number): void {
        // strip from the keys array
        const colName: string = this.keys[index];
        
        // and remove from each of the user data array
        this.userData.forEach(row => {
            delete row[colName];
        });

        this.keys.splice(index, 1);
        console.log(this.keys);
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