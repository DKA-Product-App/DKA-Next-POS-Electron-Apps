import {Connector} from "../../database/connector";


export class ProductsRepository {

    private readonly DB : Connector;

    constructor() {
        this.DB = new Connector({ name : 'init.db', key : `Cyberhack2010`});
    }
}