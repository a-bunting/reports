import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConsoleService {

    private verbose: boolean = true;

    private log: [{time: number, message: string}] = [{time: new Date().getTime(), message: "Session Started"}];

    constructor() { }

    addToLog(message: string) {
        this.log.push({time: new Date().getTime(), message: message});
        if(this.verbose) {
            console.log(message);
        }
    }
}
