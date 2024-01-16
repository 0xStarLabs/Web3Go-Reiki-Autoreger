import {privateKeysRandom, ProxyType} from "./utilities/interfaces.js";

export const quizes = true;

// http or socks
export const proxyType: ProxyType = "http";

export const gasPrice = [1.01, 1.1];

export const initializationTime = 100;

export const pause = [84000, 100000];

export const exchange = {
    withdraw: false,
    amountToWithdraw: [0.0003, 0.0005],
    okxInfo: {
        OKX_API_KEY: 'key',
        OKX_SECRET_KEY: 'key',
        OKX_PASSPHRASE: 'password',
    },
}

// "shuffle", "order", "consecutive",
export const privateKeysRandomMod: privateKeysRandom = "shuffle";

export const order = [1]
