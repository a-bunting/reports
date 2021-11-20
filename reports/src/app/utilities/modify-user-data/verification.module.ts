import { RouterModule, Routes } from "@angular/router";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModifyUserDataComponent } from "./modify-user-data.component";
import { PasswordResetComponent } from "./password-reset/password-reset.component";
import { VerifyEmailComponent } from "./verify-email/verify-email.component";
import { FormsModule } from "@angular/forms";

const routes: Routes = [
    {path: '', component: ModifyUserDataComponent, children: [
        {path: 'password', component: PasswordResetComponent},
        {path: 'verify', component: VerifyEmailComponent}
    ]}
];

@NgModule({
    imports: [
        CommonModule, 
        FormsModule,
        RouterModule.forChild(routes)
    ], 
    declarations: [
        ModifyUserDataComponent,
        PasswordResetComponent, 
        VerifyEmailComponent
    ], 
    exports: [RouterModule]
})

export class VerificationModule {}