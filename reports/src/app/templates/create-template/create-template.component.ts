import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { User } from 'src/app/utilities/authentication/user.model';

@Component({
  selector: 'app-create-template',
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss']
})
export class CreateTemplateComponent implements OnInit {

    user: User;
    isLoading: boolean = false;
    sentenceData: sentence[];
    viewData: [[sentence[]]] = [[[]]];
    initialData: sentence[];

    templateRoutes: [string[]];

    constructor(private sentenceService: SentencesService, private db: DatabaseService, private auth: AuthenticationService) { 
        auth.user.subscribe((user: User) => {
            this.user = user;
        })
    }

    ngOnInit(): void {
        this.isLoading = true;

        // get the sentence data from the database...
        this.sentenceService.getSentencesDatabase(this.user.id).subscribe((data: sentence) => {
            const sentenceData: sentence[] = [data];
            // set the data on the display
            this.initialData = JSON.parse(JSON.stringify(sentenceData));
            this.sentenceData = JSON.parse(JSON.stringify(sentenceData));
        }, (error) => {
            console.log(`Error gathering the database: ${error.message}`);
        }, () => {
            this.isLoading = false;
        })
    }

    addElement(): void {
        if(this.templateRoutes !== undefined) {
            this.templateRoutes.push([""]);
            this.viewData.push(
                this.sentenceService.getSentenceData(
                    this.templateRoutes[this.templateRoutes.length-1], 
                    false,
                    ['name']
                )
            );
        } else {
            this.templateRoutes = [[]];
            this.viewData[0] =
                this.sentenceService.getSentenceData(
                    this.templateRoutes[this.templateRoutes.length-1], 
                    false,
                    ['name']
                );
        }
        // set the view data

        console.log(this.viewData[this.viewData.length-1]);
    }

    updateElementRoute(elementId: number, index: number, id: string): void {
        console.log(elementId, index, id);
        console.log(this.templateRoutes[elementId]);
        this.templateRoutes[elementId][index+1] = id;
        console.log(this.templateRoutes[elementId]);
        this.viewData[elementId] = this.sentenceService.getSentenceData(this.templateRoutes[elementId], false, ['id','name'], false);
        console.log(this.viewData[elementId]);
    }



}
