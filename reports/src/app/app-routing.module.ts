import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AdminSentencesComponent } from './admin/sentences/admin-sentences.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { TemplatesComponent } from './templates/templates.component';
import { AuthComponent } from './utilities/auth/auth.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthGuard } from './utilities/authentication/auth-guard.guard';
import { MemberGuard } from './utilities/authentication/member.guard';
import { AdminGuard } from './utilities/authentication/admin.guard';
import { AdminUsersComponent } from './admin/users/admin-users.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { SentencesComponent } from './sentences/sentences.component';
import { EditGroupComponent } from './classes/edit-group/edit-group.component';
import { EditReportComponent } from './reports/edit-report/edit-report.component';
import { JoinComponent } from './utilities/join/join.component';
import { AdminBugReportsComponent } from './admin/admin-bug-reports/admin-bug-reports.component';
import { IntroComponent } from './utilities/intro/intro.component';
import { PrivacyComponent } from './utilities/privacy/privacy.component';
import { TermsComponent } from './utilities/terms/terms.component';

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
    {path: 'register', component: AuthComponent},
    {path: 'sentences', component: SentencesComponent, canActivate: [AuthGuard]},
    {path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard], children: [
        {path: 'sentences', component: AdminSentencesComponent},
        {path: 'users', component: AdminUsersComponent},
        {path: 'bugreports', component: AdminBugReportsComponent}
    ]},
    {path: 'join', component: JoinComponent, canActivate: [AuthGuard, MemberGuard]},
    {path: 'privacy', component: PrivacyComponent},
    {path: 'terms', component: TermsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
