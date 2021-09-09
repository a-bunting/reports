import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { sentence } from 'src/app/services/sentences.service';

@Component({
  selector: 'app-generate-template',
  templateUrl: './generate-template.component.html',
  styleUrls: ['./generate-template.component.scss']
})
export class GenerateTemplateComponent implements OnInit {

    templateData: string;

    constructor(private firestore: AngularFirestore) { }

    ngOnInit(): void {
    }

    commit() {
        // submit to the db
        const toSubmit: sentence = JSON.parse(this.templateData);

        this.firestore.collection('sentences').doc('Temporary').set(toSubmit).then(() => {
            // set the data into local storage to make it quicker ot retrieve next time...
        }, (error) => {
            console.log(`There was an error in the creation of a new sentences template: ${error.message}`);
        })

    }



}
