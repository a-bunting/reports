import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { User } from 'src/app/utilities/authentication/user.model';
import { Template, TemplateDB } from '../templates.component';
import { DocumentReference } from '@angular/fire/firestore';
import { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot, SnapshotOptions } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { generate } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


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
    templateName: string = "";
    templateCharacters: {min: number, max: number} = {min: 1, max: 500};

    constructor(private sentenceService: SentencesService, private db: DatabaseService, private auth: AuthenticationService, private santizier: DomSanitizer) { 
        this.isLoading = true;

        this.auth.user.subscribe((user: User) => {
            this.user = user;
            // once the user data is loaded...
            // get the sentence data from the database...
            this.getSentencesDatabase();
        })
    }

    ngOnInit(): void {}

    templateUpdated: boolean = false;
    templateSaved: boolean = false;
    savedTemplate: TemplateDB;

    private getSentencesDatabase() {
        this.sentenceService.getSentencesDatabase(this.user.id).subscribe((data: sentence) => {
            const sentenceData: sentence[] = [data];
            // set the data on the display
            this.initialData = JSON.parse(JSON.stringify(sentenceData));
            this.sentenceData = JSON.parse(JSON.stringify(sentenceData));
        }, (error) => {
            console.log(`Error gathering the database: ${error.message}`);
        }, () => {
            this.isLoading = false;
        });
    }

    generateTemplate(): TemplateDB {
        // parse the template first
        let parsedTemplate: string[] = [];
        // iterate and put it in databaseformat.
        this.templateRoutes.forEach((template: string[]) => {
            let newTemplate: string = "";
            // concatenate the routes...
            template.forEach((temp: string, i: number) => {
                if(i !== 0) {
                    newTemplate += "|";
                }
                newTemplate += temp;
            })
            parsedTemplate.push(newTemplate);
        })

        return {
            name: this.templateName, 
            characters: {   min: this.templateCharacters.min, 
                            max: this.templateCharacters.max
                        },
            manager: this.user.id, 
            public: false, 
            template: parsedTemplate
        }
    }

    createTemplate(): void {
        
        let newTemplate: TemplateDB = this.generateTemplate();
        this.addingToDb = true;

        this.db.addTemplate(newTemplate).pipe(take(1)).subscribe((ret: DocumentReference) => {
            // success
            this.templateId = ret.id;
        }, error => {
            console.log(`Error: ${error.message}`);
        }, () => {
            this.addingToDb = false;
            this.savedTemplate = newTemplate;
            this.templateSaved = true;
            this.templateUpdated = false;
        })
    }

    updatingDb: boolean = false;

    updateTemplate(): void {

        let newTemplate: TemplateDB = this.generateTemplate();
        this.updatingDb = true;

        this.db.updateTemplate(newTemplate, this.templateId).pipe(take(1)).subscribe(() => {
            // success
            
        }, error => {
            console.log(`Error: ${error.message}`);
        }, () => {
            this.updatingDb = false;
            this.savedTemplate = newTemplate;
        })

    }

    addingToDb: boolean = false;
    templateId: string;

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

        this.checkForUpdates();
        this.exampleSentence = this.sentenceService.generateExampleReport(this.templateRoutes);
    }

    exampleSentence: {report: string; options: number} = {report: "", options: 0};

    deleteElement(elementId: number): void {
        this.templateRoutes.splice(elementId, 1);
        this.viewData.splice(elementId, 1);
        this.checkForUpdates();
    }

    addParagraph(): void {
        if(this.templateRoutes !== undefined) {
            this.templateRoutes.push(["newParagraph"]);
            this.viewData.push(null);
        } else {
            this.templateRoutes = [["newParagraph"]];
            this.viewData[0] = null;
        }
        this.checkForUpdates();
    }

    updateElementRoute(elementId: number, index: number, id: string): void {
        this.templateRoutes[elementId][index+1] = id;
        this.viewData[elementId] = this.sentenceService.getSentenceData(this.templateRoutes[elementId], false, ['id','name'], false);
        this.exampleSentence = this.sentenceService.generateExampleReport(this.templateRoutes);
    }

    checkForUpdates(): boolean {
        let currentTemplate: string = JSON.stringify(this.generateTemplate());
        let oldTemplate: string = JSON.stringify(this.savedTemplate);

        if(currentTemplate === oldTemplate) {
            this.templateUpdated = false;
            return false;
        } else {
            this.templateUpdated = true;
            return true;
        }
    }

    canCreate(): boolean {
        if(this.templateSaved === false) {
            if(this.templateName !== "" && this.templateCharacters.min && this.templateCharacters.max) {
                if(this.templateCharacters.min < this.templateCharacters.max) {
                    if(this.templateRoutes) {
                        if(this.templateRoutes.length > 0) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }

}
