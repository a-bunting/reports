export class User {
    constructor(
        public email: string, 
        public id: string, 
        public name: string,
        public establishment: {id: string, name: string},
        public admin: boolean,
        public manager: boolean,
        public member: boolean,
        public autoUpdateDb: boolean,
        private _token: string, 
        private _tokenExpirationDate: Date
    ) {}

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

    private updateLocalStorage(): void {
        localStorage.setItem('userData', JSON.stringify(this));
    }
    
}