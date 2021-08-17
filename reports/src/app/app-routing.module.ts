import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AdminSentencesComponent } from './admin/sentences/admin-sentences.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { EditTemplateComponent } from './templates/edit-template/edit-template.component';
import { TemplatesComponent } from './templates/templates.component';
import { AuthComponent } from './utilities/auth/auth.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthGuard } from './utilities/authentication/auth-guard.guard';
import { DemoGuard } from './utilities/authentication/demo-guard.guard';
import { AdminGuard } from './utilities/authentication/admin.guard';
import { AdminUsersComponent } from './admin/users/admin-users.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';
import { SentencesComponent } from './sentences/sentences.component';
import { EditGroupComponent } from './classes/edit-group/edit-group.component';

const routes: Routes = [
    {path: 'reports', component: ReportsComponent, canActivate: [AuthGuard]},
    {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
    {path: 'templates', component: TemplatesComponent, canActivate: [AuthGuard, DemoGuard], children: [
        {path: 'create-template', component: CreateTemplateComponent},
        {path: 'edit-template', component: EditTemplateComponent}
    ]},
    {path: 'classes', component: ClassesComponent, canActivate: [AuthGuard], children: [
        {path: 'create-group', component: CreateGroupComponent},
        {path: '', component: EditGroupComponent}
    ]},
    {path: 'auth', component: AuthComponent},
    {path: 'sentences', component: SentencesComponent, canActivate: [AuthGuard]},
    {path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard], children: [
        {path: 'sentences', component: AdminSentencesComponent},
        {path: 'users', component: AdminUsersComponent}
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
