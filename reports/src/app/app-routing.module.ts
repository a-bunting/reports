import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { TemplatesComponent } from './templates/templates.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthGuard } from './utilities/authentication/auth-guard.guard';
import { PrivacyComponent } from './utilities/privacy/privacy.component';
import { TermsComponent } from './utilities/terms/terms.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { SentencesComponent } from './sentences/sentences.component';
import { EditGroupComponent } from './classes/edit-group/edit-group.component';
import { EditReportComponent } from './reports/edit-report/edit-report.component';
import { IntroComponent } from './utilities/intro/intro.component';
import { AuthComponent } from "./utilities/auth/auth.component";

const routes: Routes = [
    {path: '', component: IntroComponent},
    {path: 'reports', component: ReportsComponent, canActivate: [AuthGuard], children: [
        {path: 'edit-report', component: EditReportComponent},
        {path: 'edit-report/:id', component: EditReportComponent}
    ]},
    {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
    {path: 'templates', component: TemplatesComponent, canActivate: [AuthGuard], children: [
        {path: 'create-template', component: CreateTemplateComponent},
        {path: 'create-template/:id', component: CreateTemplateComponent}
    ]},
    {path: 'classes', component: ClassesComponent, canActivate: [AuthGuard], children: [
        {path: 'create-group', component: CreateGroupComponent},
        {path: '', component: EditGroupComponent}
    ]},
    {path: 'sentences', component: SentencesComponent, canActivate: [AuthGuard]},
    {path: 'register', component: AuthComponent},
    {path: 'terms', component: TermsComponent},
    {path: 'privacy', component: PrivacyComponent},
    {path: 'fb', loadChildren: () => import('./utilities/modify-user-data/verification.module').then(m => m.VerificationModule)},
    {path: 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
    {path: 'join', loadChildren: () => import('./utilities/join/join.module').then(m => m.JoinModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
