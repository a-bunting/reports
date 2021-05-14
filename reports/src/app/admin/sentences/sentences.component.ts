import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-sentences',
  templateUrl: './sentences.component.html',
  styleUrls: ['./sentences.component.scss']
})
export class SentencesComponent implements OnInit {

    levels: number = 1;
    
    constructor(private databaseService: DatabaseService) { 
        databaseService.getSentences();
    }

    
    ngOnInit(): void {
    }
    
}
