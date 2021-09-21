import { Injectable } from '@angular/core';

export interface Test {
    name: string; 
    variables: string[];
    test: {name: string, description: string, type: string, options?: string[]}; 
    function: Function
}


export interface NewTest {
    name: string; description: string; // explanation of the test
    settings?:  {   // settings are optional and let you select an option set as opposed to specifying one set of options for all situations. 
                    name: string;   // the name of the setting
                    description: string;    // descirption of the seeting
                    options: TestOptions[]  // the options, which include a set of options you assign to the variables
                };
    function: Function; // the function used to calculate the value
    variables:  {   name: string,   // the plain english name displayed to the user... 
                    identifier: string,  // the identifier for use in the code.
                    description: string,  // a description for the user...
                    options?: TestOptions[] // optional options if you want to override the settings, or do not HAVE nay settings.
                }[]
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

export interface TestOptions {
    name: string, options: { [key: number]: string }
}

@Injectable({
  providedIn: 'root'
})
export class TestsService {

    // define typical grade systems
    // could have this databased in the future to allow diversity...
    abcdefgGradeSystem: TestOptions =   { name: "A - G", options: { 0: "F", 1: "G-", 2: "G", 3: "G+", 4: "F-", 5: "F", 6: "F+", 7: "E-", 8: "E", 9: "E+", 10: "D-", 11: "D", 12: "D+", 13: "C-", 14: "C", 15: "C+", 16: "B-", 17: "B", 18: "B+", 19: "A-", 20: "A", 21: "A+"}}
    americanGradeSystem: TestOptions =  { name: "American (A - D and F)", options: { 0: "F", 1: "D-", 2: "D", 3: "D+", 4: "C-", 5: "C", 6: "C+", 7: "B-", 8: "B", 9: "B+", 10: "A-", 11: "A", 12: "A+"}}
    ibGradeSystem: TestOptions =        { name: "IB", options: { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7"}}
    gcseGradeSystem: TestOptions =      { name: "British GCSE", options: { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7", 7: "8", 8: "9"}}
    alevelGradeSystem: TestOptions =    { name: "AS/A Levels", options: { 0: "U", 1: "E", 2: "D", 3: "C", 4: "B", 5: "A", 6: "A*"}}
    APGradeSystem: TestOptions =        { name: "AP", options: { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5"}}
    standardsGradeSystem: TestOptions = { name: "Standards Based", options: { 0: "No Evidence", 1: "Limited Proficiency", 2: "Approaching Proficiency", 3: "Proficient", 4: "Mastery"}}

    public newTests: NewTest[] = [
        {
            name: "Grade Change", 
            settings: { name: "Grade System", description: "The grade system you work within", options: [this.abcdefgGradeSystem, this.americanGradeSystem, this.ibGradeSystem, this.gcseGradeSystem, this.alevelGradeSystem, this.APGradeSystem] },
            description: "Calculates a value taken from two grades at different points in time and returns the difference in sublevels. For example if a student moved from a B- to an A- (American grade system) this would return 3.",
            variables: [
                { name: "Current Grade", identifier: "curGrade", description: "The students grade at the time you write the report."},
                { name: "Previous Grade", identifier: "oldGrade", description: "The students grade at the time you want to compare the current grade to (for example, the last time you reported)."}
            ], 
            function: function(oldGrade: string, newGrade: string, gradingSystem: TestOptions) {
                // this is untested...
                let newGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => ({ [key]: gradingSystem.options[key] }));
                let oldwGradeValueArray: { [key: number]: string }[] = Object.keys(gradingSystem.options).map((key) => ({ [key]: gradingSystem.options[key] }));
                // get the values...
                let newValue: number = newGradeValueArray.findIndex((temp: string) => { temp === newGrade })
                let oldValue: number = oldwGradeValueArray.findIndex((temp: string) => { temp === oldGrade })
                // the difference in indices is simply the difference in grade
                // bigger values means better grade gains
                return newValue - oldValue;
            }
        }
    ]

    public testsList: Test[] = [
        {
            name: 'gradeChange', 
            variables: ['oldGrade', 'newGrade'],
            test: {name: "grdDiff", description: "The difference between their old grade and their new grade in sublevels (A to A+ is +1, A to A- is -1). Can use > or < or = to qualify.", type: "string"},
            function: (oldGrade: number, recentGrade: number): number => {
                return recentGrade - oldGrade;
            }
        }, 
        {
            name: 'improvement', 
            variables: ['improvement'],
            test: {name: "improvementFactor", description: "On a scale of 1 to 4 how much have their improved (4 is a lot, 1 is not at all)", type: "number", options: ["1", "2", "3", "4"]},
            function: (value: number): number => {
                return value;
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
    getTestVariables(testName: string): string[] | number[] {
        //get the index
        let testIndex: number = this.testsList.findIndex((test: Test) => test.name === testName);
        // and return the variables...
        return testIndex === -1 ? [] : this.testsList[testIndex].variables;
    }

}
