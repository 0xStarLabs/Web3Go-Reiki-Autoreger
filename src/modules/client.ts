import got, { Got } from "got";

import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { generateChromeUserAgent } from "../utilities/random.js";
import {proxyType} from "../config.js";

export class Client {
    private readonly proxy: string | undefined;

    constructor(proxy?: string) {
        this.proxy = proxy;
        this.client = got.extend({
            throwHttpErrors: false,
            timeout: { response: 60000 },

            retry: {
                limit: 5,
                methods: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE'],
            },
            headers: {
                "accept": "application/json, text/plain, */*",
                'accept-language': 'en-US',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'user-agent': generateChromeUserAgent()
            }
        });
    }

    public client: Got;

    async createClient() {
        if (this.proxy) {
            const { success, instance } = await this.setProxyOnClient(this.proxy);
            if (success) {
                this.client = instance;
            }
        }
        return this.client;
    }

    private async setProxyOnClient(proxy: string): Promise<{ success: boolean, instance: Got }> {
        let agent;

        switch (proxyType) {
            case 'http':
                agent = new HttpsProxyAgent(`http://${proxy}`);
                break;
            case 'socks':
                agent = new SocksProxyAgent(`socks://${proxy}`);
                break;
            default:
                return { success: false, instance: this.client }; // If proxy type is not recognized
        }

        const clientWithProxy = this.client.extend({
            agent: {
                http: agent,
                https: agent,
            },
        });

        return { success: true, instance: clientWithProxy };
    }
}
