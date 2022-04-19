import { Component, OnInit } from '@angular/core';
import { DocumentReference } from '@angular/fire/firestore';
import { CustomService } from 'src/app/services/custom.service';
import { GroupsService, Student, Group } from 'src/app/services/groups.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
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
    groupDescription: string = "";
    userDataGenerated: boolean = false;
    dataSubmitting: boolean = false;
    dataUpdating: boolean = false; // data is currently being updated...
    dataUpdated: boolean = false; // data has been saved since updating (databe is up to dtae)
    dataChanged: boolean = false;
    groupId: string; // if the class has been created this will be populated with the database id.

    numberOfStudents: number;

    helpFlag: boolean;

    constructor(
        private groupService: GroupsService,
        private auth: AuthenticationService,
        public customService: CustomService
    ) {
        auth.user.subscribe((user: User) => {
            this.user = user;
        })

        customService.greaterTooltipsFlag.subscribe((newFlag: boolean) => {
            this.helpFlag = newFlag;
        })
    }

    ngOnInit(): void {
    }

    createGroup(): void {
        this.dataSubmitting = true;
        let group: Group = { name: this.groupname, description: this.groupDescription, keys: [], managers: [], students: []};
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
    separation: string = ''; //default to tab separated... \\t
    separationRegEx: RegExp = new RegExp(this.separation);

    setDataSeparation(sepIndicator: string): void {
        this.separation = sepIndicator;
        this.separationRegEx = new RegExp(''+sepIndicator);
    }

    generateUserData() {
      switch(this.separation) {
        case '': this.autoGenerateData(); break;
        default: this.generateUserDataRowByRow(); break;
      }
    }

    /**
     * Has an attempt at auto generating data from whatever is in the box.
     * Requires consistency
     */
    autoGenerateData(): void {
      const separationTokens: string[] = [',', '\t', '|', ' ', '\n', '/', '\\', '-', ':', ';'];
      let potentialOptions: { token: string, subToken: string, count: number }[] = [];

      // set a nujmber of expected students if the number of students i defined.
      const expectedStudents: number = +this.numberOfStudents ? +this.numberOfStudents + (this.headerRow ? 1 : 0) : NaN;

      for(let i = 0 ; i < separationTokens.length; i++) {
        const token: string = separationTokens[i];
        const userData: string[] = this.userInfo.trim().split(token);
        const count: number = userData.length;

        console.log(count, expectedStudents);

        // if the number of hits from this token are the same (or 1 less if the last record has no token to end it)
        // then we may have how the students are divided up...
        if(count === expectedStudents || count === (expectedStudents - 1)) {
          // now see how the userdata might be split up
          console.log(`It seems to be splitting lines with ${token}`);

          // try each token which is not the initial token to see how the string might break up.
          // the idea here is that if say all users are aparated by a comma, each row will have the same number
          // of commas...

          for(let s = 0 ; s < separationTokens.filter(tmp => tmp !== token).length ; s++) {
            let consistent: boolean = true;
            let subToken: string = separationTokens[s];
            let lastCount: number = 0;

            // now iterate over each piece of data to see if this token might be the deliniator...
            for(let o = 1 ; o < userData.length; o++) {
              let pastCount: number = userData[o-1].trim().split(subToken).length;
              let presentCount: number = userData[o].trim().split(subToken).length;

              // see if there are a consistent number of these values in each row.
              consistent = pastCount === presentCount && pastCount > 1 && presentCount > 1;

              // if not, then this is unlikely to be the deliniator and so move on...
              if(!consistent) {
                console.log(`${subToken} is inconsistent, disregarding... ${o} (${subToken}): Pastcount: ${pastCount}, PresentCount: ${presentCount}`);
                break;
              }

              lastCount = pastCount;
            }

            // if this is consistent add it to the list off possibilities...
            if(consistent) potentialOptions.push({ token: token, subToken: subToken, count: lastCount });
        }
        }
      }

      // sort the potential options os the one with the most postential is presented first
      this.potentialOptions = potentialOptions.sort((a, b) => a.count = b.count);
      console.log({...this.potentialOptions});
      this.displayNextAutoPotential();
    }

    potentialOptions: { token: string, subToken: string, count: number }[] = [];

    displayNextAutoPotential(): void {
        if(this.potentialOptions.length > 0) {
            this.generateUserDataRowByRow(this.potentialOptions[0].token, this.potentialOptions[0].subToken);
            this.potentialOptions.shift();
        }
    }

    splitColumnToggle: number = -1;

    toggleSplitColumn(keyId: number): void {
      this.splitColumnToggle = keyId === this.splitColumnToggle ? -1 : keyId;
    }

    splitColumn(keyIndex: number, delimiter: string): void {
      console.log(keyIndex, delimiter);

      let keyToSplit: string = this.keys[keyIndex];
      let keyName: string = 'new col';

      // if there is a header row try and split that...
      if(this.headerRow) {
        let header: string[] = this.keys[keyIndex].split(delimiter);
        if(header.length === 2) { keyName = header[1]; }
      }
      // add the new key...
      this.keys.splice(keyIndex, 0, keyName);

      for(let i = 0 ; i < this.userData.length ; i++) {
        let split: string[] = this.userData[i].data[keyToSplit].split(delimiter);
        let newValue: string = split.length === 2 ? split[1] : '';
        this.userData[i].data[keyName] = newValue;
        this.userData[i].data[keyToSplit] = split[0];
      }

      this.splitColumnToggle = -1;

      console.log(this.userData);
    }

    /**
     * A function which makes an attempt to automatically detect data input...
     */
    // generateUserDataAutomatically() {
    //   // this.userDataGenerated = true;
    //   // this.groupId = undefined;
    //   // this.modifyData = false;
    //   // let data: string[];
    //   this.headerRow = false;
    //   let separationTokens: string[] = [',', '\\t', '|', '@']

    //   // first find the quantity of common things...
    //   let commaCount: number = this.userInfo.split(',').length;
    //   let tabCount: number = this.userInfo.split('\\t').length;
    //   let newLineCount: number = this.userInfo.split('\n').length;
    //   let atCount: number = this.userInfo.split('@').length;

    //   console.log(commaCount, tabCount, newLineCount, atCount, +this.numberOfStudents);

    //   // if number of students is given then the best thing to do is to try and match common tokens
    //   if(this.numberOfStudents) {
    //     let commaStudents: boolean = commaCount - (this.headerRow ? 0 : 1) === this.numberOfStudents;
    //     let tabStudents: boolean = tabCount - (this.headerRow ? 0 : 1) === this.numberOfStudents;
    //     let newLineStudents: boolean = newLineCount - (this.headerRow ? 0 : 1) === this.numberOfStudents;
    //     let atStudents: boolean = atCount - (this.headerRow ? 0 : 1) === this.numberOfStudents;

    //     // if any of this is true then try and use that as the change
    //     if(commaStudents || tabStudents || newLineStudents || atStudents) {
    //       // check which is true and try to solve that way
    //       if(commaStudents) {
    //         this.setDataSeparation(',');
    //       } else if (tabStudents) {
    //         this.setDataSeparation(',');
    //       } else if (newLineStudents) {
    //         this.setDataSeparation(',');
    //       } else if (atStudents) {
    //         let newLineIncHeader: number = newLineCount - (this.headerRow ? 1 : 0);

    //         // have a go at working out if there are emails...
    //         if(newLineIncHeader === atCount) {
    //           // seems like there may be on row for each piece of data...
    //           // now imagine how the data might be broken up...
    //           let commaPerRow: number = commaCount / newLineIncHeader;
    //           let tabPerRow: number = tabCount / newLineIncHeader;

    //           if(commaPerRow % 1 === 0 && tabPerRow % 1 !== 0) {
    //             // probably using comma deliniation
    //             this.setDataSeparation(',');
    //           } else if(tabPerRow % 1 === 0 && commaPerRow % 1 !== 0) {
    //             // probably using tab deliniation
    //             this.setDataSeparation('\\t');
    //           } else if(tabPerRow % 1 === 0 && commaPerRow % 1 === 0) {
    //             // probably using tab deliniation with a comma for each name
    //             this.setDataSeparation('[,\\t]');
    //           }
    //         }
    //       }
    //     }

    //   }

    //   // first try @ count as this is likely only to show itself in an email, an email identifying each individual
    //   if(atCount > 0) {
    //     let newLineIncHeader: number = newLineCount - (this.headerRow ? 1 : 0);

    //     // have a go at working out if there are emails...
    //     if(newLineIncHeader === atCount) {
    //       // seems like there may be on row for each piece of data...
    //       // now imagine how the data might be broken up...
    //       let commaPerRow: number = commaCount / newLineIncHeader;
    //       let tabPerRow: number = tabCount / newLineIncHeader;

    //       if(commaPerRow % 1 === 0 && tabPerRow % 1 !== 0) {
    //         // probably using comma deliniation
    //         this.setDataSeparation(',');
    //       } else if(tabPerRow % 1 === 0 && commaPerRow % 1 !== 0) {
    //         // probably using tab deliniation
    //         this.setDataSeparation('\\t');
    //       } else if(tabPerRow % 1 === 0 && commaPerRow % 1 === 0) {
    //         // probably using tab deliniation with a comma for each name
    //         this.setDataSeparation('[,\\t]');
    //       }
    //     }
    //   }

    //   // if the number of new lines is very high its likely now that each piece of data
    //   // is on a new line... 35 being the upper bound for students in a class...
    //   if(newLineCount > 35) {

    //   }




    //   this.generateUserData();
    // }

    generateUserDataRowByRow(rows: string = '\n', colDeliniator?: string) {
        this.userDataGenerated = true;
        this.groupId = undefined;
        this.modifyData = false;
        let data: string[];

        // if the deliniator flag is set then use that to work it out...
        if(colDeliniator) this.setDataSeparation(colDeliniator);

        data = this.userInfo.split(rows);

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
    columnValueChange(index: number, input: string) {
        const newKeyArray: string[] = [...this.keys];

        newKeyArray[index] = input;

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

    createNewGroup(): void {
        this.userData = undefined;
        this.userInfo = undefined;
        this.groupDescription = undefined;
        this.groupname = undefined;
        this.keys = undefined;
        this.modifyData = false;
        this.userDataGenerated = false;
        this.dataSubmitting = false;
        this.dataUpdating = false; // data is currently being updated...
        this.dataUpdated = false; // data has been saved since updating (databe is up to dtae)
        this.dataChanged = false;
        this.groupId;
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
