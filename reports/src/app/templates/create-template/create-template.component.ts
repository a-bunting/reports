import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Template, TemplateDB, TemplatesService } from 'src/app//services/templates.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { User } from 'src/app/utilities/authentication/user.model';
import { DocumentReference } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CustomService } from 'src/app/services/custom.service';


@Component({
  selector: 'app-create-template',
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss']
})
export class CreateTemplateComponent implements OnInit, OnDestroy {

    user: User;
    isLoading: boolean = false;
    sentenceData: sentence[];
    viewData: [[sentence[]]] = [[[]]];
    initialData: sentence[];

    templateRoutes: [string[]];
    templateName: string = "";
    templateCharacters: {min: number, max: number} = {min: 1, max: 500};

    helpFlag: boolean;

    constructor(
        private router: ActivatedRoute, 
        private navigation: Router,
        private templateService: TemplatesService, 
        private sentenceService: SentencesService, 
        private auth: AuthenticationService,
        public customService: CustomService
    ) 
    { 
        customService.greaterTooltipsFlag.subscribe((newFlag: boolean) => {
            this.helpFlag = newFlag;
        })
    }

    paramObservable: Subscription;

    ngOnInit(): void {
        this.isLoading = true;

        // get the user data...
        this.auth.user.subscribe((user: User) => {
            // set the user
            this.user = user;
        });

        // get the sentence database...
        this.sentenceService.getSentencesDatabase(this.user.id).pipe(take(1)).subscribe({
            next: (data: sentence) => {
                const sentenceData: sentence[] = [data];
                // set the data on the display
                this.initialData = JSON.parse(JSON.stringify(sentenceData));
                this.sentenceData = JSON.parse(JSON.stringify(sentenceData));
                this.isLoading = false;

                // set an observable...
                // subscribe to the parameter and if it changes then reload the information.
                this.paramObservable = this.router.params.subscribe((params: Params) => {
                    // if no changes were saved for previous template then send the data back to the templates.ts
                    if(this.templateUpdated) {
                        this.changeEmitter(false, false, this.savedTemplate.name);
                    }
                    // set the id and load the template
                    this.templateId = params.id;
                    this.loadTemplate(this.templateId);
                });
        },  error: (error) => { console.log(`Error gathering the database: ${error.message}`); }});
        
    }

    ngOnDestroy(): void {
        // unsubscribe fromt he parameters observable.
        this.paramObservable.unsubscribe();
    }

    /**
     * Load the template 
     * @param id 
     */
    loadTemplate(id: string | undefined): void {
        if(id !== undefined) {            
            const templateData: Template = this.templateService.getTemplate(id);
            // and use the data to populate the template...
            this.templateCharacters.min = templateData.characters.min;
            this.templateCharacters.max = templateData.characters.max;
            this.templateName = templateData.name;

            // split the routes up into their paragraphs...
            this.viewData = [[[]]];
            this.templateRoutes = undefined;

            this.updateViewdata(templateData.template);

            this.savedTemplate = this.generateTemplate();
            this.templateUpdated = false;
            this.templateSaved = true;
            this.exampleSentence = this.sentenceService.generateCompoundReport(this.templateRoutes);
            this.exampleSentence.report = this.sentenceService.stripVariables(this.exampleSentence.report);
        }
    }
    
    /**
     * Updates the viewdata for a given route...
     * @param route 
     */
    updateViewdata(route: [string[]]): void {
        this.viewData = [[[]]];
        this.templateRoutes = undefined;

        route.forEach((route: string[], elementId: number) => {

            if(route[0] === "newParagraph") {
                // add a new paragraph.
                this.addParagraph();
            } else {
                // add a new element and add all the routes to it.
                this.addElement();
                // add routes.
                route.forEach((routeCode: string, index: number) => {
                    try {
                        this.updateElementRoute(elementId, index - 1, routeCode);
                    } catch (error) {
                        console.log(`Error: ${error}`);
                        this.deleteElement(this.templateRoutes.length - 1);
                    }
                })
            } 
        })
    }

    templateUpdated: boolean = false;
    templateSaved: boolean = false;
    savedTemplate: TemplateDB;

    /**
     * From the enetred data generates a TemplateDB object
     * @returns TemplateDB
     */
    generateTemplate(): TemplateDB {
        // parse the template first
        let parsedTemplate: string[] = this.templateService.parseTemplate(this.templateRoutes);

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

    /**
     * called from the html, creates the template then navigates to the edit page
     * upon success...
     */
    createTemplate(): void {
        // generate a new database format template
        let newTemplate: TemplateDB = this.generateTemplate();
        this.addingToDb = true;
        // add to the database...
        this.templateService.addNewTemplate(newTemplate, this.templateRoutes).subscribe((ret: DocumentReference) => {
            // success
            this.templateId = ret.id;
            this.addingToDb = false;
            this.savedTemplate = newTemplate;
            this.templateSaved = true;
            this.templateUpdated = false;
            this.changeEmitter(false, true, this.templateName);
            this.navigation.navigate(['templates/create-template/' + this.templateId]);
        }, error => {
            console.log(`Error: ${error}`);
        })

    }

    updatingDb: boolean = false;

    /**
     * Update the template in the database and in local storage...
     */
    updateTemplate(): void {
        // generate a new template
        let newTemplate: Template = {
            id: this.templateId,
            name: this.templateName, 
            characters: {   min: this.templateCharacters.min, 
                            max: this.templateCharacters.max
                        },
            public: false, 
            template: this.templateRoutes
        };
        // set it as updating the db.
        this.updatingDb = true;

        // subscribe tot he templates service and update as apprpriate...
        this.templateService.updateTemplate(newTemplate).subscribe(() => {
            // success
            const newSavedTemplate: TemplateDB = this.generateTemplate();
            // and set flags.
            this.updatingDb = false;
            this.savedTemplate = newSavedTemplate;
            this.templateUpdated = false;
        }, error => {
            console.log(`Error updating database (local storage unaffected): ${error}`);
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
        this.exampleSentence = this.sentenceService.generateCompoundReport(this.templateRoutes);
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

    /**
     * Updates the view and route data for the selected route templates.
     * @param elementId 
     * @param index 
     * @param id 
     */
    updateElementRoute(elementId: number, index: number, id: string): void {
        let idCopy: string = id;
        // first set the route data
        // NOTE here that nothing id done is ** end ** is clicked.
        if (id === "allOptInclusive") {
            // this means all options below this can contribute sentences...
            const data = this.sentenceService.getSentenceData(this.templateRoutes[elementId], false, ['id'], false);
            let allLastIds: string = "";

            // iterate over the data to extract the next level of ids.
            data[index].forEach((temp: {id: string, order: number, index: number}, index: number) => {
                // divide the ids by a /
                index !== 0 ? allLastIds += "/" : null;
                // add the id to the string
                allLastIds += temp.id;
            })
            // set id to all the ids combined..
            id = allLastIds;
        }

        // up to here, all ids printed in the form id1/id2/id3 etc...
        this.templateRoutes[elementId][index+1] = id;
        this.templateRoutes[elementId].length = index + 2;

        // generate an example sentence            
        this.exampleSentence = this.sentenceService.generateCompoundReport(this.templateRoutes);
        this.exampleSentence.report = this.sentenceService.stripVariables(this.exampleSentence.report);

        // console.log(`Stripping: ${this.sentenceService.stripVariables(this.exampleSentence.report)}`);

        // finally set the viewdata
        if(idCopy === ("" || "allOptInclusive")) {
            this.viewData[elementId].splice(index + 1);
        } else {
            this.viewData[elementId] = this.sentenceService.getSentenceData(this.templateRoutes[elementId], false, ['id','name','tests'], false);
        }

        this.checkForUpdates();
    }

    checkForUpdates(): boolean {
        if(this.savedTemplate) {
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
        return undefined;
    }

    canCreate(): boolean {
        if(this.templateSaved === false) {
            if(this.templateName !== "" && this.templateCharacters.min && this.templateCharacters.max) {
                if(this.templateCharacters.min <= this.templateCharacters.max) {
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

    deletingTemplate: boolean = false;

    deleteTemplate(): void {
        this.deletingTemplate = true;
        this.templateService.deleteTemplate(this.templateId).subscribe({
            next : () => {
                // success... reload?
                this.deletingTemplate = false;
                // remove from the list
                this.changeEmitter(true);
                // reload this page to a blank version...
                this.navigation.navigate(['templates/create-template']);
        },  error: (error) => {
                console.log(`Error deleting template: ${error}`);
                this.deletingTemplate = false;
        }})
    }

    changeEmitter(deleted: boolean = false, created: boolean = false, name: string = this.templateName): void {
        // only smit if the template is saved already...
        if(this.templateSaved) {
            const del: boolean = deleted ? deleted : false;
            const cre: boolean = created ? created : false;
            const emit: {id: string, name: string, deleted: boolean, created: boolean} = {id: this.templateId, name: name, deleted: del, created: cre};
            // and emit...
            this.templateService.dataChange(emit);
        }
    }

    /**
     * Check if a string is a route combination
     * @param route 
     * @returns 
     */
    allInclusivityChecker(route: string | undefined): boolean {
        if(route !== undefined) {
            if(route.split('/').length > 1) {
                return true;
            }
        }
        return false;
    }

    dragFrom: number;
    dragging: boolean = false;
    dragTimeout: boolean = false;

    dragPositionChange(index: number): void {
        this.dragFrom = index;
        this.dragging = true;
    }

    dropPosition(): void {
        this.dragging = false;
    }

    allowDrop(event):void {
        event.preventDefault();
        // get the target
        let dropIndex: number = event.target.value;

        if(dropIndex !== this.dragFrom && !this.dragTimeout) {
            this.reOrderElements(this.dragFrom, dropIndex);
            this.dragFrom = dropIndex;
                // set a timeout before a reorder can happen again
            setTimeout(() => {
                this.dragTimeout = false;
            }, 500);
        }
    }

    reOrderElements(from: number, to: number): void {
        this.dragTimeout = true;
        let copy: string[] = [...this.templateRoutes[from]];

        this.templateRoutes.splice(from, 1);
        this.templateRoutes.splice(to, 0, copy);

        this.updateViewdata(this.templateRoutes);
    }

    /**
     * listen for the escape key press to make any tempory changes go away!
     * @param event 
     */
     @HostListener('document:keydown.escape', ['$event']) onEscapeKeyPress(event: KeyboardEvent) {
        this.dragging = false;
    }

}
