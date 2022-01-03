import { Component, OnInit } from '@angular/core';
import { AngularFirestore, DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { tap, map, mergeMap, take } from 'rxjs/operators';
import { User } from 'src/app/utilities/authentication/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { ConsoleService } from 'src/app/admin/services/console.service';
import { Observable, zip } from 'rxjs';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { Template, TemplatesService } from 'src/app/services/templates.service';
import { Group, GroupsService } from 'src/app/services/groups.service';
import { Report, ReportsService, ReportTemplate } from 'src/app/services/reports.service';

export interface FirebaseUser {
    id: string, name: string; email: string; admin: boolean; manager: boolean;
}

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {

    userList: FirebaseUser[];       // the list to display to the user
    fullUserList: FirebaseUser[];   // the list retrived from the database.
    loading: boolean;
    loadingMessage: string;
    user: User;

    constructor(private auth: AuthenticationService,
                private firebase: AngularFirestore, 
                private fFunctions: AngularFireFunctions,
                private console: ConsoleService,
                private sentenceService: SentencesService,
                private templateService: TemplatesService, 
                private groupService: GroupsService, 
                private reportService: ReportsService            
    ) { }

    ngOnInit(): void {
        // subscribe to the user authentication information.  
        this.auth.user.subscribe(user => {
            this.user = user;
        })
        // call the user list...
        this.listUsers();
    }

    listUsers() {
        var users: FirebaseUser[] = [];
        this.loading = true;

        this.firebase.collection('users').get().pipe(take(1)).subscribe((userData: QuerySnapshot<any>) => {
            userData.docs.forEach((user: DocumentSnapshot<any>) => {
                users.push({
                    id: user.id,
                    name: user.data().name,
                    email: user.data().email,
                    admin: user.data().admin ? true : false,
                    manager: user.data().manager ? true : false
                })
            });

            this.loading = false;
            this.loadingMessage = undefined;
            this.fullUserList = users;
            this.userList = users;
        }, (error: any) => {
            this.loadingMessage = `Error loading userlist: ${error.message} Click to retry...`;
            this.loading = false;
        });
    }

    /**
     * Updates the users list based upon a search
     * Not perfect right now as the main query takes only 100 records but fine for now.
     * @param input the text input the search name and email for.
     */
    updateUsersList(input: string): void {
        if(input.length > 1) {
            const keywords: string[] = input.split(" ");
    
            this.userList = this.fullUserList.filter((user: FirebaseUser) => {
                let result: boolean = false;
                keywords.forEach((word: string) => {
                    if(word.length > 1 && (user.email.includes(word) || user.name.includes(word))) {
                        result = true;
                    }
                })
                return result;
            })
        } else {
            this.userList = this.fullUserList;
        }
    }

    modifyUserData(userEmail: string, key: string, value: string | boolean | number): Observable<any> {
        const obs = this.firebase.collection('users', ref => ref.where('email', '==', userEmail)).get();

        return obs.pipe(take(1), map((result: QuerySnapshot<any>) => {
            result.docs.forEach((doc: QueryDocumentSnapshot<any>) => {
                this.firebase.collection('users').doc(doc.id).update({[key]: value});
                this.console.addToLog(`Modified database: ${userEmail} has key '${key}' set to '${value}'.`);

                // update the arrays...
                this.modifyUserLists(userEmail, key, value);
            })
        }));
    }

    modifyUserLists(userEmail: string, key: string, value: string | boolean | number): void {
        // run through the arrays twice to find the value. Emails only appear once so this can be broken when found.
        // maybe not perfect, but good enough for the small use case.
        // the full user list
        let fullUserList: FirebaseUser[] = this.fullUserList;
        let userList: FirebaseUser[] = this.userList;

        for(let i = 0 ; i < fullUserList.length ; i++) {
            if(fullUserList[i].email === userEmail) {
                fullUserList[i][key] = value;
                this.fullUserList = fullUserList;
                break;
            }
        }
        // and the visible user list
        for(let i = 0 ; i < userList.length ; i++) {
            if(userList[i].email === userEmail) {
                userList[i][key] = value;
                this.userList = userList;
                break;
            }
        }
    }

    /**
     * Modify the status of the admin - toggle function
     * 
     * @param email the email of the user to change
     * @param currentStatus true or false
     * @param button the button clicked on the page
     */
    modifyAdminStatus(email: string, currentStatus: boolean, button: any) {
        let obs: Observable<any>;
        button.target.innerHTML = "Working...";
        
        // set the observable based upon the current status
        if(currentStatus === true) {
            obs = this.removeAdmin(email);  
        } else {
            obs = this.addAdmin(email);
        }
        
        obs.subscribe(() => {
            button.target.innerHTML = "Admin";
        }, (error: any) => {
            button.target.innerHTML = "Admin";
            this.console.addToLog(`Failed to change the admin status of ${email} to ${!currentStatus}: ${error.message}`);
        })
    }

    /**
     * Modify the status of the admin - toggle function
     * 
     * @param email the email of the user to change
     * @param currentStatus true or false
     * @param button the button clicked on the page
     */
    modifyManagerStatus(email: string, currentStatus: boolean, button: any) {
        let obs: Observable<any>;
        button.target.innerHTML = "Working...";
        
        // set the observable based upon the current status
        if(currentStatus === true) {
            obs = this.removeManager(email);  
        } else {
            obs = this.addManager(email);
        }
        
        obs.subscribe(() => {
            button.target.innerHTML = "Manager";
        }, (error: any) => {
            button.target.innerHTML = "Manager";
            this.console.addToLog(`Failed to change the manager status of ${email} to ${!currentStatus}: ${error.message}`);
        })
    }

    addAdmin(email: string): Observable<any> {
        const addAdminRole = this.fFunctions.httpsCallable('addAdminRole');
        // add the email to the admin list
        return addAdminRole({ email: email }).pipe(take(1), mergeMap(() => {
            return this.modifyUserData(email, 'admin', true);
        }));
    }

    removeAdmin(email: string): Observable<any> {
        const removeAdminRole = this.fFunctions.httpsCallable('removeAdminRole');
        // add the email to the admin list
        return removeAdminRole({ email: email }).pipe(take(1), mergeMap(() => {
            return this.modifyUserData(email, 'admin', false);
        }));
    }

    addManager(email: string): Observable<any> {
        const addManagerRole = this.fFunctions.httpsCallable('addManagerRole');
        // add the email to the manager list
        return addManagerRole({ email: email }).pipe(take(1), mergeMap(() => {
            return this.modifyUserData(email, 'manager', true);
        }));
    }

    removeManager(email: string): Observable<any> {
        const removeManagerRole = this.fFunctions.httpsCallable('removeManagerRole');
        // remove the email from the manager list
        return removeManagerRole({ email: email }).pipe(take(1), mergeMap(() => {
            return this.modifyUserData(email, 'manager', false);
        }));
    }    

    becomeUser(email: string, uid: string): void {
        this.downloadUserProfile(uid).subscribe({
            next: (result: [sentence, Template[], Group[], ReportTemplate[]]) => {
                console.log("You are now user " + uid);
            }
        });

    }

    downloadUserProfile(uid: string): Observable<[sentence, Template[], Group[], ReportTemplate[]]> {
        let getSentenceDb = this.sentenceService.getSentencesDatabase('template', true).pipe(take(1), map((result: sentence) => { return result; }));  
        let getTemplateDb = this.templateService.getTemplates(true, uid).pipe(take(1), map((result: Template[]) => { return result; }));
        let getGroupsDb = this.groupService.getGroups(true, uid).pipe(take(1), map((result: Group[]) => { return result; }));
        let getReportsDb = this.reportService.getReports(true, uid).pipe(take(1), map((result: ReportTemplate[]) => { return result; }));
        
        return zip(getSentenceDb, getTemplateDb, getGroupsDb, getReportsDb);
    }

}
