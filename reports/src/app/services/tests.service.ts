import { Injectable } from '@angular/core';
import { Student } from '../classes/create-group/create-group.component';

export interface Test {
    name: string; description: string; // explanation of the test - name preceded by 'Select a '...
    settings?:  {   // settings are optional and let you select an option set as opposed to specifying one set of options for all situations. 
                    name: string;   // the name of the setting
                    description: string;    // descirption of the seeting
                    options: TestOptions[]  // the options, which include a set of options you assign to the variables
                };
    calculateValueFunction: Function; // the function used to calculate the value
    testFunction: Function; // returns a boolean which says if the value passed the test or not.
    test: { // the thing used in the sentences database that users can select.
        // all tests are expressions, i.e. "> 3", "= 5", "<-2, >2"
        name: string; // the name of the test
        description: string; // expalantion of the test and the values to be enetered...
        validityFunction: Function; // a function to check the input value is of the correct format
        options?: string[]; // if there are predertermined values they go in here...
    }
    variables:  TestVariable[]
}

export interface TestVariable {
    name: string,   // the plain english name displayed to the user... 
    identifier: string,  // the identifier for use in the code.
    description: string,  // a description for the user...
    options?: TestOptions[] // optional options if you want to override the settings, or do not HAVE nay settings.
}

export interface TestOptions {
    name: string, options: { [key: number]: string }
}

// what does a template need for a test?
export interface TemplateTest {
    name: string; // the name of the test
    values: {
        name: string; // the name of the testing value
        value: string | number; // the value assigned to this test for the specific sentenceStem
        options?: string[] | number[]; // just a store of the possible options this can take. bit of poor resource usage but easiest solution...
    }
}



@Injectable({
  providedIn: 'root'
})
export class TestsService {

    // define typical grade systems
    gradingSystems: TestOptions[] = [
        { name: "A - G", options: { 0: "F", 1: "G-", 2: "G", 3: "G+", 4: "F-", 5: "F", 6: "F+", 7: "E-", 8: "E", 9: "E+", 10: "D-", 11: "D", 12: "D+", 13: "C-", 14: "C", 15: "C+", 16: "B-", 17: "B", 18: "B+", 19: "A-", 20: "A", 21: "A+"}},
        { name: "American (A - D and F)", options: { 0: "F", 1: "D-", 2: "D", 3: "D+", 4: "C-", 5: "C", 6: "C+", 7: "B-", 8: "B", 9: "B+", 10: "A-", 11: "A", 12: "A+"}},
        { name: "IB", options: { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7"}},
        { name: "British GCSE", options: { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7", 7: "8", 8: "9"}},
        { name: "AS/A Levels", options: { 0: "U", 1: "E", 2: "D", 3: "C", 4: "B", 5: "A", 6: "A*"}},
        { name: "AP", options: { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5"}},
        { name: "Standards Based", options: { 0: "No Evidence", 1: "Limited Proficiency", 2: "Approaching Proficiency", 3: "Proficient", 4: "Mastery"}}
    ];

    public testsList: Test[] = [
        {
            name: "Grade Change", 
            settings: { name: "Grade System", description: "The grade system you work within", options: this.gradingSystems },
            description: "Calculates a value taken from two grades at different points in time and returns the difference in sublevels. For example if a student moved from a B- to an A- (American grade system) this would return 3.",
            test: {
                name: "Expression", 
                description: "The conditions by which this test is met, i.e. '>3' means that if they have gained over 3 subgrades this test will pass. You can do multiple tests splitting them with a comma, i.e. '>3,<8' will be true for 4, 5, 6 and 7 but false otherwise.", 
                validityFunction: function(expression: string): boolean {
                    // split the expression into all its individual tests
                    let multipleExpression: string[] = expression.split(',');
                    let returnValue: boolean;
                    // iterate over each of the values...
                    multipleExpression.forEach((splitExpression: string) => {
                        let regEx: RegExp = new RegExp('([><=]{1,2})', 'ig');
                        let exp: string[] = splitExpression.split(regEx);
                        exp.shift(); // remove the first entry which is always 0
                        // check it makes sense..
                        if(exp.length > 1 && (exp[0] === "<" || ">" || "=" || "<=" || ">=")) {
                            // and if its a string then only = should be used...
                            if(isNaN(Number(exp[1]))) {  
                                // its a string...
                                exp[0] === "=" ? (returnValue !== false ? returnValue = true : returnValue = false) : returnValue = false;
                            } else returnValue !== false ? returnValue = true : returnValue = false;
                            
                        } else {
                            // either no number, string or expression is given, or its an inccorect format...
                            returnValue = false;
                        }
                    })
                    // if it got to this point all passed and so is true...
                    return returnValue;
                }
            },
            variables: [
                { name: "Current Grade", identifier: "curGrade", description: "The students grade at the time you write the report."},
                { name: "Previous Grade", identifier: "oldGrade", description: "The students grade at the time you want to compare the current grade to (for example, the last time you reported)."}
            ], 
            calculateValueFunction: (userData: Student): number => {
                // get the grading system
                let gradingSystem: TestOptions = this.findGradingSystemByName(userData['settings'].name);
                // find the user grades...
                let newGrade: string = userData['curGrade'];
                let oldGrade: string = userData['oldGrade'];
                // this is untested...
                let newGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => (  gradingSystem.options[key] ));
                let oldGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => (  gradingSystem.options[key] ));
                // let newGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => ({ [key]: gradingSystem.options[key] }));
                // let oldwGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => ({ [key]: gradingSystem.options[key] }));
                // get the values...
                let newValue: number = newGradeValueArray.indexOf(newGrade);
                let oldValue: number = oldGradeValueArray.indexOf(oldGrade);
                // the difference in indices is simply the difference in grade
                // bigger values means better grade gains
                return newValue - oldValue;
            },
            // calculateValueFunction: function(oldGrade: string, newGrade: string, gradingSystem: TestOptions) {
            //     // this is untested...
            //     let newGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => ({ [key]: gradingSystem.options[key] }));
            //     let oldwGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => ({ [key]: gradingSystem.options[key] }));
            //     // get the values...
            //     let newValue: number = newGradeValueArray.findIndex((temp: string) => { temp === newGrade })
            //     let oldValue: number = oldwGradeValueArray.findIndex((temp: string) => { temp === oldGrade })
            //     // the difference in indices is simply the difference in grade
            //     // bigger values means better grade gains
            //     return newValue - oldValue;
            // },
            testFunction: function(valueToTest: number|string, testPattern: string): boolean {
                let validPattern: boolean = this.test.validityFunction(testPattern);
                
                if(validPattern) {
                    // split the expression into all its individual tests
                    let multipleExpression: string[] = testPattern.split(',');
                    let currentPassStatus: boolean;
                    // problem with foreach is it will run through it all even if a false is returned...
                    multipleExpression.forEach((splitExpression: string) => {
                        if(currentPassStatus !== false) {
                            // split into expression and value...
                            let regEx: RegExp = new RegExp('([><=]{1,2})', 'ig');
                            let exp: string[] = splitExpression.split(regEx);
                            exp.shift(); // remove the first entry which is always 0
    
                            // check if its a string or not in order to test it...
                            if(isNaN(Number(exp[1]))) {
                                // its a string...
                                let valueToTestAgainst: string = exp[1];
                                valueToTestAgainst === valueToTest ? currentPassStatus = true : currentPassStatus = false;
                            } else {
                                let valueToTestAgainst: number = Number(exp[1]);
                                // run through the options - looks nicer in a switch :)
                                switch(exp[0]) {
                                    case "<": valueToTest < valueToTestAgainst ? currentPassStatus = true : currentPassStatus = false; break;
                                    case ">": valueToTest > valueToTestAgainst ? currentPassStatus = true : currentPassStatus = false; break;
                                    case "=": valueToTest === valueToTestAgainst ? currentPassStatus = true : currentPassStatus = false; break;
                                    case "==": valueToTest === valueToTestAgainst ? currentPassStatus = true : currentPassStatus = false; break;
                                    case ">=": valueToTest >= valueToTestAgainst ? currentPassStatus = true : currentPassStatus = false; break; 
                                    case "<=": valueToTest <= valueToTestAgainst ? currentPassStatus = true : currentPassStatus = false; break;
                                    default: currentPassStatus = false;
                                }
                            }
                        }
                    });
                    return currentPassStatus;
                } else {
                    console.log(`Pattern error in test machine...`);
                    return false;
                };
            }
        }
    ]


    constructor() { }

    /**
     * Get a test based upon the name...
     * @param testName 
     * @returns 
     */
    getTest(testName: string): Test {
        //get the index
        let testIndex: number = this.testsList.findIndex((test: Test) => test.name === testName);
        // and return the variables...
        return testIndex === -1 ? null : this.testsList[testIndex];
    }


    /**
     * Returns the variables required for a test
     * @param testName 
     * @returns 
     */
    getTestVariables(testName: string): TestVariable[] {
        //get the index
        let testIndex: number = this.testsList.findIndex((test: Test) => test.name === testName);
        // and return the variables...
        return testIndex === -1 ? [] : this.testsList[testIndex].variables;
    }

    /**
     * Find a grading system by the name...
     * @param name 
     * @returns 
     */
    findGradingSystemByName(name: string): TestOptions {
        let gradingIndex: number = this.gradingSystems.findIndex((temp: TestOptions) => temp.name === name);
        return this.gradingSystems[gradingIndex];
    }

}






    // old tests list - too basic...
    // public testsList: Test[] = [
    //     {
    //         name: 'gradeChange', 
    //         variables: ['oldGrade', 'newGrade'],
    //         test: {name: "grdDiff", description: "The difference between their old grade and their new grade in sublevels (A to A+ is +1, A to A- is -1). Can use > or < or = to qualify.", type: "string"},
    //         function: (oldGrade: number, recentGrade: number): number => {
    //             return recentGrade - oldGrade;
    //         }
    //     }, 
    //     {
    //         name: 'improvement', 
    //         variables: ['improvement'],
    //         test: {name: "improvementFactor", description: "On a scale of 1 to 4 how much have their improved (4 is a lot, 1 is not at all)", type: "number", options: ["1", "2", "3", "4"]},
    //         function: (value: number): number => {
    //             return value;
    //         }
    //     }
    // ]

    // export interface OldDeprecatedTest {
    //     name: string; 
    //     variables: string[];
    //     test: {name: string, description: string, type: string, options?: string[]}; 
    //     function: Function
    // }