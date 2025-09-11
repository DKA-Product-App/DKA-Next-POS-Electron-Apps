import { Printer, Image } from "@node-escpos/core";
import Network from "@node-escpos/network-adapter";


export default class Printers {

    private readonly device : Network
    private printer : Printer<any>

    constructor({ address, port, timeout} : { address : string, port ?: number, timeout ?: number}) {
        this.device = new Network(address, port, timeout);
    }

    async open() {
        this.device.open(async (error, device) => {
            this.printer = new Printer(this.device, { encoding: "GB18030" });

        })
    }

}