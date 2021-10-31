import { Injectable } from '@angular/core';
import { Student } from 'src/app/services/groups.service';

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
        }, 
        {
            name: "Skill Level", 
            settings: { name: "Grade System", description: "The grade system you work within", options: this.gradingSystems },
            description: "Simply test if a student is at a particular skill level. To compare skill levels use the 'grade change' test.",
            test: {
                name: "Skill Level (%age)", 
                description: "A grade is input, and is tested against this percentage range (from-to). So for example 90-100 means this test passes if the user is in the top 90-100% of the grade range available. For An A-F scale with subgrades this would mean an A+ and an A fall into the 90-100 range and would pass this test.", 
                validityFunction: function(expression: string): boolean {
                    // split the expression into all its individual tests
                    let returnValue: boolean;
                    // iterate over each of the values...
                    let regEx: RegExp = new RegExp('([-]{1})', 'ig');
                    let exp: string[] = expression.split(regEx); // should have an array of [number, '-', number]
                    // strip out any percentages user might have put in......
                    exp.forEach((section: string, i: number) => { exp[i] = section.replace('%', '');  })
                    // check it makes sense..
                    if(exp.length === 3) {
                        // and if its a string then only = should be used...
                        if(isNaN(Number(exp[0])) || isNaN(Number(exp[2]))) {  
                          // either value is a string...
                          returnValue = false;
                        } else {
                          if(+exp[0] >= 0 && +exp[2] <= 100 && +exp[0] <= 99 && +exp[2] >= 1) {
                            returnValue !== false ? returnValue = true : returnValue = false;
                          } else {
                            returnValue = false;
                          }
                        } 
                    } else {
                        // either no number, string or expression is given, or its an inccorect format...
                        returnValue = false;
                    }
                    // if it got to this point all passed and so is true...
                    return returnValue;
                }
            },
            variables: [
                { name: "Current Level", identifier: "curSkillLevel", description: "The students skill level at the time you write the report."},
                { name: "Skill Name", identifier: "skillName", description: "The skill that this particular test is checking."}
            ], 
            calculateValueFunction: (userData: Student): number => {
                // get the grading system
                let gradingSystem: TestOptions = this.findGradingSystemByName(userData['settings'].name);
                let numberOfGradeEntries: number = Object.keys(gradingSystem).length;
                // get the value of the user within the grade scale and find the user grades...
                let levelValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => (  gradingSystem.options[key] ));
                let level: string = userData['curSkillLevel'];
                let positionInScale: number = levelValueArray.indexOf(level);
                // get the values...
                // the difference in indices is simply the difference in grade
                // bigger values means better grade gains
                return positionInScale * (100 / numberOfGradeEntries);
            },
            testFunction: function(valueToTest: number, testPattern: string): boolean {
                let validPattern: boolean = this.test.validityFunction(testPattern);
                
                if(validPattern) {
                    // split into expression and value...
                    let regEx: RegExp = new RegExp('([-]{1,1})', 'ig');
                    let exp: string[] = testPattern.split(regEx); // should have an array of [number, '-', number]
                    // strip out any percentages user might have put in......
                    exp.forEach((section: string, i: number) => { exp[i] = section.replace('%', '');  })

                    if(valueToTest >= +exp[0] && valueToTest <= +exp[2]) {
                        return true;
                    } else return false;
                } else {
                    console.log(`Pattern error in test machine...`);
                    return false;
                };
            }
        }, 
        {
            name: "Grade Level", 
            settings: { name: "Grade System", description: "The grade system you work within", options: this.gradingSystems },
            description: "Simply returns a value which indicates where the student is within the grade scale as a poercentage. A student doing very well will be close to the 100% and students struggling will be closer to 0%.",
            test: {
                name: "Grade Level (%age)", 
                description: "A grade is input, and is tested against this percentage range (from-to). So for example 90-100 means this test passes if the user is in the top 90-100% of the grade range available. For An A-F scale with subgrades this would mean an A+ and an A fall into the 90-100 range and would pass this test.", 
                validityFunction: function(expression: string): boolean {
                    // split the expression into all its individual tests
                    let returnValue: boolean;
                    // iterate over each of the values...
                    let regEx: RegExp = new RegExp('([-]{1})', 'ig');
                    let exp: string[] = expression.split(regEx); // should have an array of [number, '-', number]
                    // strip out any percentages user might have put in......
                    exp.forEach((section: string, i: number) => { exp[i] = section.replace('%', '');  })
                    // check it makes sense..
                    if(exp.length === 3) {
                        // and if its a string then only = should be used...
                        if(isNaN(Number(exp[0])) || isNaN(Number(exp[2]))) {  
                          // either value is a string...
                          returnValue = false;
                        } else {
                          if(+exp[0] >= 0 && +exp[2] <= 100 && +exp[0] <= 99 && +exp[2] >= 1) {
                            returnValue !== false ? returnValue = true : returnValue = false;
                          } else {
                            returnValue = false;
                          }
                        } 
                    } else {
                        // either no number, string or expression is given, or its an inccorect format...
                        returnValue = false;
                    }
                    // if it got to this point all passed and so is true...
                    return returnValue;
                }
            },
            variables: [
                { name: "Current Grade", identifier: "curGrade", description: "The students grade level at the time you write the report."}
            ], 
            calculateValueFunction: (userData: Student): number => {
                // get the grading system
                let gradingSystem: TestOptions = this.findGradingSystemByName(userData['settings'].name);
                let numberOfGradeEntries: number = Object.keys(gradingSystem).length;
                // get the value of the user within the grade scale and find the user grades...
                let levelValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => (  gradingSystem.options[key] ));
                let level: string = userData['curGrade'];
                let positionInScale: number = levelValueArray.indexOf(level);
                // get the values...
                // the difference in indices is simply the difference in grade
                // bigger values means better grade gains
                return positionInScale * (100 / numberOfGradeEntries);
            },
            testFunction: function(valueToTest: number, testPattern: string): boolean {
                let validPattern: boolean = this.test.validityFunction(testPattern);
                
                if(validPattern) {
                    // split into expression and value...
                    let regEx: RegExp = new RegExp('([-]{1,1})', 'ig');
                    let exp: string[] = testPattern.split(regEx); // should have an array of [number, '-', number]
                    // strip out any percentages user might have put in......
                    exp.forEach((section: string, i: number) => { exp[i] = section.replace('%', '');  })

                    if(valueToTest >= +exp[0] && valueToTest <= +exp[2]) {
                        return true;
                    } else return false;
                } else {
                    console.log(`Pattern error in test machine...`);
                    return false;
                };
            }
        }, 
        {   // this isnt well written because data is replicated... sort out later.
            name: "Next Stage", 
            settings: { name: "Their next steps", description: "Where are they going next year?", options: [{ name: "Where are they going for their next time period?", options: { 0: "Leaving school", 1: "Staying in this course", 2: "Course is over", 3: "Graduating", 4: "I am leaving"}}] },
            description: "Where are the students going for the next time period (end of year usually going to be course over, and end of a semester would be to stay in the course",
            test: {
                name: "Student Movement", 
                description: "This will be displayed for those students who are going to this place.", 
                options: ["Leaving school", "Staying in this course", "Course is over", "Graduating", "I am leaving"],
                validityFunction: function(expression: string): boolean {
                    // simply check if the value is in the options available...
                    return ["Leaving school", "Staying in this course", "Course is over", "Graduating", "I am leaving"].includes(expression);
                }
            },
            variables: [
                { name: "Where are they going?", identifier: "nextSteps", description: "What are the students doing next semester with respect to this school or course?"}
            ], 
            calculateValueFunction: (userData: Student): string => {
                return userData['nextSteps'];
            },
            testFunction: function(valueToTest: string, testString: string): boolean {
                // simply a comparison between the user value and the test value
                return valueToTest === testString;
            }
        }, 
        {   // this isnt well written because data is replicated... sort out later.
            name: "Effort", 
            settings: { name: "The effort level", description: "How much effort does the student put into their work?", options: [{ name: "Effort Level", options: { 0: "No effort", 1: "Very little effort", 2: "Acceptable effort", 3: "Good effort", 4: "High level of effort"}}] },
            description: "Where are the students going for the next time period (end of year usually going to be course over, and end of a semester would be to stay in the course",
            test: {
                name: "Maximum Effort Level", 
                description: "This helps differentiate students by their effort levels. ALl students at this level and above pass the test.", 
                options: ["No effort", "Very little effort", "Acceptable effort", "Good effort", "High level of effort"],
                validityFunction: function(expression: string): boolean {
                    // simply check if the value is in the options available...
                    return ["No effort", "Very little effort", "Acceptable effort", "Good effort", "High level of effort"].includes(expression);
                }
            },
            variables: [
                { name: "Effort Level", identifier: "effortLevel", description: "How much effort would you say the student puts into their work?"}
            ], 
            calculateValueFunction: (userData: Student): string => {
                return userData['effortLevel'];
            },
            testFunction: function(valueToTest: string, testString: string): boolean {
                let effortLevels: string[] = ["No effort", "Very little effort", "Acceptable effort", "Good effort", "High level of effort"];
                // where the user is on the scale...
                let minEffortIndex: number = effortLevels.findIndex((temp: string) => temp === valueToTest);
                // where they need to be to pass the test...
                let comparisonEffort: number = effortLevels.findIndex((temp: string) => temp === valueToTest);
                // simply a comparison between the user value and the test value
                return minEffortIndex >= comparisonEffort;
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