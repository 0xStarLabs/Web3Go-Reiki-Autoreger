import * as userAgents from '../../data/user_agents.json' assert { type: 'json' };

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


export function getRandomDigital(min: number, max: number) {
    const randomFraction = Math.random();
    const randomValueInRange = min + randomFraction * (max - min);
    return parseFloat(randomValueInRange.toFixed(18));
}

export function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export function shuffleNumbers(min: number, max: number): number[] {
    if (min > max) {
        throw new Error('Minimum value should not be greater than maximum value.');
    }

    // Create an array from min to max
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = range.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [range[i], range[j]] = [range[j], range[i]];
    }

    return range;
}


export function generateChromeUserAgent(): string {
    return getRandomElement(userAgents.default)
}