import { Injectable } from '@angular/core';

export interface Test {
    name: string; 
    variables: string[];
    test: {name: string, description: string, type: string, options?: string[]}; 
    function: Function
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
