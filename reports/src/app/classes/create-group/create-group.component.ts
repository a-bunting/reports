import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss']
})
export class CreateGroupComponent implements OnInit {

    headerRow: boolean = true;
    userData;

    constructor() { }

    ngOnInit(): void {
    }

    generateUserData() {

        let data: String[];

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
        let newData = [];

        // if there is a header row build a list of the keys to use for this dataset
        if(this.headerRow) {
            keys = data[0].split(",");
            // data.shift(); // get rid of the title array
        } else {
            // create a set of keys which is just numbers...
            data[0].split(",").forEach((e: string, i: number) => {
                keys.push(`${i}`);
            })
        }

        // iterate over the data and build a new array
        data.forEach((row: string) => {
            let newUserData = row.split(",");
            let user = {};

            newUserData.forEach((dataPoint, i: number) => {
                const keyName: string = keys[i];
                user = { ...user, [keyName] : dataPoint };
            })

            console.log(user);
            newData.push(user);
        })

        this.userData = newData;
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
Albus,Quirell,Albus,M
George,McGonagall,George,F
Ron,Santiago,Ron,M
Ginny,Weasley,Ginny,M
Charlie,Dursley,Charlie,M
Cho,Dumbledore,Cho,F
Hermione,Dursley,Hermione,M
Charlie,Boyle,Charlie,F
`;