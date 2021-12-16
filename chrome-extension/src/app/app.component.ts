import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    
    title = 'ReportZone Chrome Extension';
    data: any;

    constructor() {

    }

    ngOnInit(): void {
        
        chrome.webRequest.onCompleted.addListener((details: chrome.webRequest.WebResponseCacheDetails) => {
            this.data = details.method;
        }, {urls: ["<all_urls>"]})

    }

    refresh(): void {
    }
}
