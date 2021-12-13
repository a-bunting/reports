import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss']
})
export class StopwatchComponent implements OnInit {

    hours: number = 0;
    minutes: number = 21;
    seconds: number = 5;

    started: boolean = false;

    timer;

    constructor() { }

    ngOnInit(): void {
    }

    start(): void {
        this.started = true;
        this.timer = setInterval(() => {
            this.seconds += 1;
            
            if(this.seconds === 60) {
                this.seconds = 0;
                this.minutes += 1;

                if(this.minutes === 60) {
                    this.minutes = 0;
                    this.hours += 1;
                }
            }
        }, 1000);
    }

    pause(): void {
        this.started = false;
        clearInterval(this.timer);
    }

    reset(): void {
        this.seconds = 0;
        this.minutes = 0;
        this.hours = 0;
    }

}
