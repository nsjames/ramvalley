import { setContext } from 'svelte';
import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';

export const user:Writable<string|null> = writable(null);
export const loaded:Writable<boolean> = writable(false);
export const totalRounds:Writable<number> = writable(0);
export const currentRound:Writable<number> = writable(0);
export const roundData:Writable<any> = writable({});
export const userData:Writable<any> = writable({});
export const working:Writable<boolean> = writable(false);
