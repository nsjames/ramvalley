import { PUBLIC_GAME_ACCOUNT, PUBLIC_GAME_NETWORK } from '$env/static/public'
export const randomString = (length) => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

export async function sha256(input: any, inputFormat = 'text') {
    let data;
    if (inputFormat === 'text') {
        const encoder = new TextEncoder();
        data = encoder.encode(input);
    } else if (inputFormat === 'hex') {
        const match = input.match(/.{1,2}/g);
        if (match) {
            data = new Uint8Array(match.map(byte => parseInt(byte, 16)));
        }
    }

    return await crypto.subtle.digest('SHA-256', data);
}

export function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export const getGameAccount = () => {
    return PUBLIC_GAME_ACCOUNT || 'rambambambam';
}

export const getGameNetwork = () => {
    return PUBLIC_GAME_NETWORK || 'Jungle4';
}
