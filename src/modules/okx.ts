import ccxt from 'ccxt'
import logger from "../utilities/logger.js";
import {getRandomDigital, getRandomInt} from "../utilities/random.js";
import {getBalance, sleep} from "../utilities/common.js";
import {exchange} from "../config.js";


export class Okx {
    private okx: any;
    private readonly address: string
    private readonly walletNumber: number;

    constructor(address: string, walletNumber: number) {

        this.address = address;
        this.walletNumber = walletNumber;

        this.okx = new ccxt.okx({
            apiKey: exchange.okxInfo.OKX_API_KEY,
            secret: exchange.okxInfo.OKX_SECRET_KEY,
            password: exchange.okxInfo.OKX_PASSPHRASE
        });
    }

    async withdraw() {

        let retry = true;
        while (retry) {
            try {
                const amountToWithdraw = Number(getRandomDigital(exchange.amountToWithdraw[0], exchange.amountToWithdraw[1]).toFixed(getRandomInt(5, 8)));
                logger.info(`| ${this.walletNumber} | Trying to withdraw ${amountToWithdraw} - BNB`);
                await this.okx.withdraw("BNB", amountToWithdraw.toString(), this.address, undefined, {
                    'network': "BSC",
                    'fee': 0.002,
                    "pwd": '-'
                });

                let updatedBalance: number;
                do {
                    updatedBalance = Number((await getBalance(this.address)).toFixed(getRandomInt(5, 8)));
                    await sleep(60, 120);
                } while (updatedBalance.toFixed(5) == (await getBalance(this.address)).toFixed(5));

                logger.success(`| ${this.walletNumber} | Successfully withdrawn ${amountToWithdraw} - "BNB`);
                retry = false;

            } catch (error: any) {
                if (error instanceof ccxt.InsufficientFunds || error['err-code'] === 'dw-insufficient-balance') {
                    logger.error('Insufficient balance, retrying withdrawal');
                    await sleep(300, 900);
                } else if (error.code === '58214' || error.message.includes('58214')) {
                    logger.error('Withdrawal suspended due to maintenance. Retrying...');
                    await sleep(300, 900);
                } else {
                    logger.error(`Unexpected error: ${error.message}`);
                    await sleep(300, 900);
                }
            }
        }
    }
}
