import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TemplatesComponent } from './templates/templates.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { AuthComponent } from './utilities/auth/auth.component';
import { FormsModule } from '@angular/forms';
import { AdminComponent } from './admin/admin.component';
import { AdminSentencesComponent } from './admin/sentences/admin-sentences.component';
import { LoadingSpinnerComponent } from './utilities/loading-spinner/loading-spinner.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthenticationService } from './utilities/authentication/authentication.service';
import { environment } from 'src/environments/environment';
import { AngularFireModule } from '@angular/fire';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AdminUsersComponent } from './admin/users/admin-users.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { SentencesComponent } from './sentences/sentences.component';
import { EditGroupComponent } from './classes/edit-group/edit-group.component';
import { EditReportComponent } from './reports/edit-report/edit-report.component';
import { JoinComponent } from './utilities/join/join.component';
import { BugreportComponent } from './utilities/bugreport/bugreport.component';
import { AdminBugReportsComponent } from './admin/admin-bug-reports/admin-bug-reports.component';
import { NgxPayPalModule } from 'ngx-paypal';

@NgModule({
  declarations: [
    AppComponent,
    TemplatesComponent,
    ClassesComponent,
    ReportsComponent,
    CreateTemplateComponent,
    AuthComponent,
    AdminComponent,
    AdminSentencesComponent,
    LoadingSpinnerComponent,
    DashboardComponent,
    AdminUsersComponent,
    CreateGroupComponent,
    SentencesComponent,
    EditGroupComponent,
    EditReportComponent,
    JoinComponent,
    BugreportComponent,
    AdminBugReportsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    FormsModule, 
    HttpClientModule, 
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule, 
    NgxPayPalModule
  ],
  providers: [
        AuthenticationService,
        AngularFireFunctions, 
        AngularFireAuthModule, 
        AngularFirestoreModule
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
