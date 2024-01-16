export type privateKeysRandom = "shuffle" | "order" | "consecutive";
export type ProxyType = "http" | "socks"

export type IDS = "16a58c18-d3c9-4b8d-aedc-937e7e762a5c" | "8e4403e6-dc1d-44b3-b80a-bb3ed0f91471" | "0aeb6c87-8c83-4cc6-a7da-e2b0e786c67c" | "631bb81f-035a-4ad5-8824-e219a7ec5ccb" | "374a470f-2e87-4408-9817-71531bb876ad" | "d5cec2e4-ef2e-4598-9963-4552e9b32ef5";

export interface QuizResponse {
    id: IDS;
    title: string;
    description: string;
    rewardPoints: number;
    extraRewards: string;
    checkRuleLink: string;
    rewardDescription: string;
    countdownThreshold: number;
    startsAt: string;
    endsAt: string;
    totalItemCount: number;
    currentProgress: number;
}

export interface LoginResponse {
    address: string;
    chain: string;
    challenge: string;
    extra: Extra;
    nonce: string;
    signature: string;
    verified: boolean;
}

interface Extra {
    account: string;
    authFrom: string;
    token: string;
}

interface QuizQuestionOption {
    A: string;
    B: string;
    C: string;
    D?: string; // Assuming 'D' might be optional
}

interface QuizQuestionItem {
    id: string;
    sortIndex: number;
    question: string;
    options: QuizQuestionOption;
    answers: string[];
    type: string;
    answerCount: number;
}

export interface QuizQuestionResponse {
    id: string;
    topic: string;
    title: string;
    description: string;
    show: boolean;
    status: string;
    rewardPoints: number;
    extraRewards: string;
    checkRuleLink: string;
    countdownThreshold: number;
    rewardDescription: string;
    startsAt: string;
    endsAt: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    lumiLink: string;
    items: QuizQuestionItem[];
    currentProgress: number;
    totalItemCount: number;
}
