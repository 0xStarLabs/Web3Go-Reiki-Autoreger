import {ethers} from "ethers";
import dayjs from 'dayjs';
import { Got } from "got";
import {gasPrice, pause, quizes} from "../config.js";
import {handleResponse, retry} from "../utilities/wrappers.js";
import logger from "../utilities/logger.js";
import {CONTRACT, QUIZES} from "../utilities/constants.js";
import {getRandomDigital} from "../utilities/random.js";
import {IDS, LoginResponse, QuizQuestionResponse, QuizResponse, GiftResponse} from "../utilities/interfaces.js";
import {sleep} from "../utilities/common.js";

export class Reiki {
    private client: Got;
    private readonly wallet: ethers.Wallet;
    private readonly walletNumber: number;
    private readonly address: string;

    constructor(wallet: ethers.Wallet, walletNumber: number, client: Got) {
        this.wallet = wallet;
        this.address = wallet.address;
        this.client = client;
        this.walletNumber = walletNumber;
    }

    private async mint() {
        try {
            return await retry(async () => {
                const contract = await CONTRACT.connect(this.wallet);
                const tx = await contract.safeMint(this.address, {
                    gasPrice: ethers.utils.parseUnits(getRandomDigital(gasPrice[0], gasPrice[1]).toFixed(2), "gwei")
                });
                const txResponse = await tx.wait();
                return await handleResponse(txResponse, this.walletNumber, "PASSPORT MINT");
            });
        } catch (error: any) {
            throw new Error("Error in Reiki - mint: " + error.message);
        }
    }

    private async getNonce() {
        try {
            return await retry(async () => {
                const response: any = await this.client.post(
                    `https://reiki.web3go.xyz/api/account/web3/web3_nonce`,
                    {
                        json: {
                            address: this.address,
                        },
                        responseType: 'json'
                    }
                );
                return response.body["nonce"]
            });
        } catch (error: any) {
            throw new Error("Error in Reiki - getNonce: " + error.message);
        }
    }

    private async login() {
        try {
            return await retry(async () => {
                const date = dayjs().toISOString();
                const nonce = await this.getNonce();

                const message = `reiki.web3go.xyz wants you to sign in with your Ethereum account:\n${this.address}\n\nWelcome to Web3Go! Click to sign in and accept the Web3Go Terms of Service. This request will not trigger any blockchain transaction or cost any gas fees. Your authentication status will reset after 7 days. Wallet address: ${this.address} Nonce: ${nonce}\n\nURI: https://reiki.web3go.xyz\nVersion: 1\nChain ID: 56\nNonce: ${nonce}\nIssued At: ${date}`;
                const jsonMessage = JSON.stringify({msg: message});
                const signature = await this.wallet.signMessage(message);

                logger.info(`| ${this.walletNumber} | ${this.address} | Trying to login`);
                const responseRaw = await this.client.post(
                    `https://reiki.web3go.xyz/api/account/web3/web3_challenge`,
                    {
                        json: {
                            address: this.address,
                            challenge: jsonMessage,
                            nonce: nonce,
                            signature: signature,
                        },
                        responseType: 'json'
                    },
                );
                const responseBody = responseRaw.body as LoginResponse;
                const token = responseBody.extra.token;

                logger.success(`| ${this.walletNumber} | ${this.address} | Successfully logged in`);
                return token;
            });
        } catch (error: any) {
            throw new Error("Error in Reiki - login: " + error.message);
        }
    };


    private async checkIn() {
        try {
            return await retry(async () => {
                logger.info(`| ${this.walletNumber} | ${this.address} | Doing checkIn`);
                await this.client.put(
                    'https://reiki.web3go.xyz/api/checkin',
                    {
                        searchParams: {
                            'day': dayjs().format('YYYY-MM-DD')
                        }
                    });
                logger.success(`| ${this.walletNumber} | ${this.address} | Successfully checked in`);
            });
        } catch (error: any) {
            logger.error("Error in Reiki - checkIn: " + error.message);
        }
    }

    private async getNftCount() {
        try {
            return await retry(async () => {
                return Number(await CONTRACT.balanceOf(this.address));
            });
        } catch (error: any) {
            throw new Error("Error in Reiki - getNftCount: " + error.message);
        }
    }

    private async quiz() {
        try {
            return await retry(async () => {
                const quizResponseRaw = await this.client.get("https://reiki.web3go.xyz/api/quiz", { responseType: 'json' });
                const quizesRaw: QuizResponse[] = quizResponseRaw.body as QuizResponse[];
                const quizes: IDS[] = quizesRaw.map((quiz: QuizResponse) => quiz.id);

                logger.info(`| ${this.walletNumber} | ${this.address} | Doing quizes`);
                for (let quiz of quizes) {
                    const questionsRaw = await this.client.get(`https://reiki.web3go.xyz/api/quiz/${quiz}`, {
                        responseType: 'json'
                    });
                    const questions = questionsRaw.body as QuizQuestionResponse;
                    const questionIds = questions.items.map(item => item.id);
                    for (let i = 0; i < 5; i++) {
                        let answer = quiz === "631bb81f-035a-4ad5-8824-e219a7ec5ccb" && i == 0 ? [this.address] : QUIZES[quiz][(i + 1).toString()];
                        await this.client.post(
                            `https://reiki.web3go.xyz/api/quiz/${questionIds[i]}/answer`,
                            {
                                json: {
                                    'answers': answer
                                }
                            }
                        );
                        await this.client.get(`https://reiki.web3go.xyz/api/quiz/${quiz}`);
                        logger.success(`| ${this.walletNumber} | ${this.address} | Successfully passed ${i + 1} out of 5 Questions`);
                        await sleep(5, 10);
                    }
                    logger.success(`| ${this.walletNumber} | ${this.address} | Successfully passed ${quizes.indexOf(quiz) + 1} out of 6 Quizes`);
                }
            });
        } catch (error: any) {
            logger.error("Error in Reiki - quiz: " + error.message);
        }
    }

    private async giftOpen() {
        try {
            return await retry(async () => {
                logger.info(`| ${this.walletNumber} | ${this.address} | Opening Gift`);
                const recentGiftsRaw = await this.client.get(
                    `https://reiki.web3go.xyz/api/gift`,
                    {
                        searchParams: {
                            'type': 'recent',
                        },
                        responseType: 'json'
                    });
                const recentGifts = recentGiftsRaw.body as GiftResponse[];
                const giftId = recentGifts[0].id;
                await this.client.post(`https://reiki.web3go.xyz/api/gift/open/${giftId}`);
                logger.success(`| ${this.walletNumber} | ${this.address} | Successfully Opened Gift`);
            });
        } catch (error: any) {
            logger.error("Error in Reiki - giftOpen: " + error.message);
        }
    }
    async execute() {
        try {
            return await retry(async () => {
                const token = await this.login();
                this.client = this.client.extend({
                    headers: {
                        'authorization': `Bearer ${token}`,
                    }
                });
                await sleep(5, 10)
                const nftCount: number = await this.getNftCount();
                if (nftCount == 0) {
                    await this.mint();
                    await sleep(5, 10)
                    await this.checkIn();
                    await sleep(5, 10)
                    await this.giftOpen();
                }

                if (quizes) {
                    await this.quiz()
                }

                while (true) {
                    await this.checkIn();
                    await sleep(pause[0], pause[1]);
                    const token = await this.login();
                    this.client = this.client.extend({
                        headers: {
                            'authorization': `Bearer ${token}`,
                        }
                    });
                }
            });
        } catch (error: any) {
            logger.error(`| ${this.walletNumber} | Error in Reiki - execute:`, error.message);
        }
    }
}
