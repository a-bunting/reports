import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { SentencesComponent } from './admin/sentences/sentences.component';
import { ClassesComponent } from './classes/classes.component';
import { ReportsComponent } from './reports/reports.component';
import { CreateTemplateComponent } from './templates/create-template/create-template.component';
import { EditTemplateComponent } from './templates/edit-template/edit-template.component';
import { TemplatesComponent } from './templates/templates.component';
import { AuthComponent } from './utilities/auth/auth.component';
import { DashboardComponent } from './utilities/dashboard/dashboard.component';
import { AuthGuard } from './utilities/auth/auth-guard.guard';
import { UsersComponent } from './admin/users/users.component';
import { CreateGroupComponent } from './classes/create-group/create-group.component';

const routes: Routes = [
    {path: 'reports', component: ReportsComponent, canActivate: [AuthGuard]},
    {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
    {path: 'templates', component: TemplatesComponent, canActivate: [AuthGuard], children: [
        {path: 'create-template', component: CreateTemplateComponent},
        {path: 'edit-template', component: EditTemplateComponent}
    ]},
    {path: 'classes', component: ClassesComponent, canActivate: [AuthGuard], children: [
        {path: 'create-group', component: CreateGroupComponent}
    ]},
    {path: 'auth', component: AuthComponent},
    {path: 'admin', component: AdminComponent, canActivate: [AuthGuard], children: [
        {path: 'sentences', component: SentencesComponent},
        {path: 'users', component: UsersComponent}
    ]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
