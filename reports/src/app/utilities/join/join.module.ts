import { RouterModule, Routes } from "@angular/router";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JoinComponent } from "./join.component";
import { AuthGuard } from "../authentication/auth-guard.guard";
import { NgxPayPalModule } from "ngx-paypal";

const titleNamePrexif: string = "ReportZone"

const routes: Routes = [
    {path: '', component: JoinComponent, canActivate: [AuthGuard], data: { title: `${titleNamePrexif} - Join ${titleNamePrexif}` }}
]

@NgModule({
    imports: [
        CommonModule, 
        NgxPayPalModule,
        RouterModule.forChild(routes)
    ], 
    declarations: [
        JoinComponent
    ], 
    exports: [RouterModule]
})

export class JoinModule {}