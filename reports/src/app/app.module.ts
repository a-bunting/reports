import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TemplatesComponent } from './templates/templates.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthenticationService } from './utilities/authentication/authentication.service';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { SentencesComponent } from './sentences/sentences.component';
import { EditGroupComponent } from './classes/edit-group/edit-group.component';
import { EditReportComponent } from './reports/edit-report/edit-report.component';
import { BugreportComponent } from './utilities/bugreport/bugreport.component';
import { IntroComponent } from './utilities/intro/intro.component';
import { PasswordChangeComponent } from './utilities/password-change/password-change.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    TemplatesComponent,
    ClassesComponent,
    ReportsComponent,
    CreateTemplateComponent,
    LoadingSpinnerComponent,
    DashboardComponent,
    CreateGroupComponent,
    SentencesComponent,
    EditGroupComponent,
    EditReportComponent,
    BugreportComponent,
    IntroComponent,
    PasswordChangeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    HttpClientModule, 
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    FormsModule
  ],
  providers: [
        AuthenticationService,
        AngularFireFunctions, 
        AngularFireAuthModule, 
        AngularFirestoreModule, 
        Title
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
