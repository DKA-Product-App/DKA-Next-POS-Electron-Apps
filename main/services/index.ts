import {OrganizationsRepository} from "../repositories/organizations";
import {app} from "electron";


export class Services {
    static get OrganizationRepository(): OrganizationsRepository {
        return this._OrganizationRepository;
    }

    static set OrganizationRepository(value: OrganizationsRepository) {
        this._OrganizationRepository = value;
    }

    private static _OrganizationRepository : OrganizationsRepository;
    constructor() {
        Services.OrganizationRepository = new OrganizationsRepository();

        app.on('quit', () => {
            Services.OrganizationRepository.destroy().then(() => undefined);
        });
    }

}