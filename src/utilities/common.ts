import fs from "fs";
import path from "path";
import {order, privateKeysRandomMod} from "../config.js";
import {shuffleNumbers} from "./random.js";
import logger from "./logger.js";
import {retry} from "./wrappers.js";
import {ethers} from "ethers";
import {PROVIDER} from "./constants.js";

export function getPrivateKeys(): [string[], string[], number[]] {
    let allPrivateKeys: string[] = fs.readFileSync(`./data/private_keys.txt`, 'utf-8').split('\n').map(wallet => wallet.trim());
    let orderedPrivateKeys: string[] = [];
    let accountsOrder: number[] = [];

    switch (privateKeysRandomMod) {
        case 'order':
            orderedPrivateKeys = order.map((index) => allPrivateKeys[index - 1]);
            accountsOrder = [...order]; // Copying order
            break;

        case 'shuffle':
            let shuffledIndexes = shuffleNumbers(1, allPrivateKeys.length);
            orderedPrivateKeys = shuffledIndexes.map((index) => allPrivateKeys[index - 1]);
            accountsOrder = [...shuffledIndexes]; // Copying shuffled indexes

            // Update the order in the config.ts file
            const configPath = path.join('./src/config.ts');
            let configContent = fs.readFileSync(configPath, 'utf-8');
            configContent = configContent.replace(/order\s*=\s*\[[^\]]*\]/, `order = [${shuffledIndexes.join(', ')}]`);
            fs.writeFileSync(configPath, configContent);

            break;

        case 'consecutive':
            orderedPrivateKeys = [...allPrivateKeys];
            accountsOrder = Array.from({ length: allPrivateKeys.length }, (_, i) => i + 1); // Creating a consecutive array
            break;

        default:
            throw new Error("Invalid privateKeysRandomMod value");
    }

    return [orderedPrivateKeys, allPrivateKeys, accountsOrder];
}

export function getProxies() {
    return fs.readFileSync(`./data/proxies.txt`, 'utf-8').split('\n').map(wallet => wallet.trim());
}

export async function getRPC(urls: string[]) {
    try {
        return await retry(async () => {
            const selectedUrl = urls[Math.floor(Math.random() * urls.length)];
            return new ethers.providers.JsonRpcProvider({
                url: selectedUrl,
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                skipFetchSetup: true,
                timeout: 10000
            });
        });
    } catch (error) {
        console.error(`Error getting rpc`, error);
        throw error;
    }
}

export async function getContract(contractAddress: string, contractABI: string, provider: ethers.providers.JsonRpcProvider) {
    return await retry(async () => {
        return new ethers.Contract(contractAddress, contractABI, provider);
    });
}

export async function getBalance(address: string) {
    return await retry(async () => {
        return Number(ethers.utils.formatEther(await (await PROVIDER).getBalance(address)))
    });
}

export async function sleep(min: number, max: number): Promise<void> {
    let sleepTime = Math.floor(Math.random() * (max - min + 1) + min) * 1000;
    logger.info(`Sleeping for ${sleepTime / 1e3} seconds...`);
    return new Promise(resolve => setTimeout(resolve, sleepTime));
}

