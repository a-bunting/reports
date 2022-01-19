import { Transaction } from "./authentication.service";

export class User {

    init: number;

    constructor(
        public email: string, 
        public id: string, 
        public name: string,
        public establishment: {id: string, name: string},
        public admin: boolean,
        public manager: boolean,
        public member: boolean,
        public provider: string,
        public autoUpdateDb: boolean,
        public transactionHistory: Transaction[],
        private _token: string, 
        private _tokenExpirationDate: Date
    ) {
        this.init = new Date().getTime();
    }

    get token(): string {
        if(!this._tokenExpirationDate || new Date() > this._tokenExpirationDate) {
            return null;
        }
        return this._token;
    }

    get tokenExpiration(): Date {
        return this.tokenExpiration;
    }

    set setUsername(username: string) {
        this.name = username;
        this.updateLocalStorage();
    }
    
    set setAutoUpdate(value: boolean) {
        this.autoUpdateDb = value;
        this.updateLocalStorage();
    }
    
    set setEst(est: {id: string, name: string}) {
        this.establishment = est;
        this.updateLocalStorage();
    }

    set setExpirationTime(time: number) {
        this._tokenExpirationDate = new Date(time);
        this.updateLocalStorage();
    }

    private updateLocalStorage(): void {
        localStorage.setItem('userData', JSON.stringify(this));
    }

    
    public getMembershipExpiryTime(): number {
        let expiryTime: number;
        let timePurchase: number = 0;
        // add up all the ms left on all the payments made
        this.transactionHistory.forEach((transaction: Transaction) => {
            if(transaction.validUntil > this.init) {
                timePurchase += transaction.validUntil - this.init;
            }
        })
        expiryTime = timePurchase + this.init;
        // return the time remaining on the membership in ms.
        return expiryTime ?? 0;
    }
    
}