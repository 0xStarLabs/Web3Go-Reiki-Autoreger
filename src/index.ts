import {ethers} from "ethers";
import {exchange, initializationTime} from "./config.js";
import {getBalance, getPrivateKeys, getProxies, sleep} from "./utilities/common.js";
import logger from "./utilities/logger.js";
import { Client } from "./modules/client.js";
import {Reiki} from "./modules/reiki.js";
import {Okx} from "./modules/okx.js";
import {PROVIDER} from "./utilities/constants.js";

class Main {
    private readonly privateKeys: string[];
    private readonly notShuffledKeys: string[];
    private readonly accountsOrder: number[]
    private readonly proxies: string[]

    constructor() {
        [this.privateKeys, this.notShuffledKeys, this.accountsOrder] = getPrivateKeys();
        this.proxies = getProxies();
    }

    async runThread(wallet: ethers.Wallet, walletNumber: number) {
        logger.info(`| ${walletNumber} | ${wallet.address} | Running thread `);
        const clientInstance = new Client(this.proxies[walletNumber - 1]);
        const client = await clientInstance.createClient();

        const reiki = new Reiki(wallet, walletNumber, client);

        const balance = await getBalance(wallet.address);
        const nftCount = await reiki.getNftCount();

        if (balance < 0.00002 && nftCount == 0) {
            if (!exchange.withdraw) {
                logger.info(`| ${walletNumber} | ${wallet.address} | Skipping the wallet because the balance is too low: ${balance} and exchange withdraw is turned off`);
                return;
            } else {
                const okxInstance = new Okx(wallet.address, walletNumber);
                await okxInstance.withdraw();
            }
        }

        await reiki.execute()
    }

    async execute() {
        logger.info(`Accounts Order: ${this.accountsOrder}\n`);

        const promises = [];
        for (let privateKey of this.privateKeys) {
            const wallet = new ethers.Wallet(privateKey, await PROVIDER);
            const walletNumber = this.notShuffledKeys.indexOf(privateKey) + 1
            // Create a promise for the thread execution
            const promise = this.runThread(wallet, walletNumber).then(() => {
                logger.success(`| ${walletNumber} | Thread completed`)
            });
            promises.push(promise);
            await sleep(initializationTime / (2 * this.privateKeys.length), initializationTime * 2 / this.privateKeys.length);
        }
        await Promise.all(promises);
    }
}


(async () => {
    try {
        const mainClass = new Main();
        await mainClass.execute();
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
