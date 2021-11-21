import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss']
})
export class IntroComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute) { }

    codeMessage: string;

    ngOnInit(): void {      
        let code: string = this.activatedRoute.snapshot.queryParams['code'];
        
        // depending on the code display a message...
        switch(code) {
            case 'passResetSuccess': this.codeMessage = "Your password was successfully update, please login as normal."; break;
            case 'passResetNoSuccess': this.codeMessage = "Your password was not successfully updated, please try again."; break;
            default: this.codeMessage = undefined; break;
        }

    }

}
