/**
 * EOSIO Core v0.6.8
 * https://github.com/greymass/eosio-core
 *
 * @license
 * Copyright (c) 2020 FFF00 Agents AB & Greymass Inc. All Rights Reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 * 
 *  1. Redistribution of source code must retain the above copyright notice, this
 *     list of conditions and the following disclaimer.
 * 
 *  2. Redistribution in binary form must reproduce the above copyright notice,
 *     this list of conditions and the following disclaimer in the documentation
 *     and/or other materials provided with the distribution.
 * 
 *  3. Neither the name of the copyright holder nor the names of its contributors
 *     may be used to endorse or promote products derived from this software without
 *     specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 * 
 * YOU ACKNOWLEDGE THAT THIS SOFTWARE IS NOT DESIGNED, LICENSED OR INTENDED FOR USE
 * IN THE DESIGN, CONSTRUCTION, OPERATION OR MAINTENANCE OF ANY MILITARY FACILITY.
 */
import rand from 'brorand';

function arrayEquals(a, b) {
    const len = a.length;
    if (len !== b.length) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
function arrayEquatableEquals(a, b) {
    const len = a.length;
    if (len !== b.length) {
        return false;
    }
    for (let i = 0; i < len; i++) {
        if (!a[i].equals(b[i])) {
            return false;
        }
    }
    return true;
}
const hexLookup = {};
function buildHexLookup() {
    hexLookup.enc = new Array(0xff);
    hexLookup.dec = {};
    for (let i = 0; i <= 0xff; ++i) {
        const b = i.toString(16).padStart(2, '0');
        hexLookup.enc[i] = b;
        hexLookup.dec[b] = i;
    }
}
function arrayToHex(array) {
    if (!hexLookup.enc) {
        buildHexLookup();
    }
    const len = array.length;
    const rv = new Array(len);
    for (let i = 0; i < len; ++i) {
        rv[i] = hexLookup.enc[array[i]];
    }
    return rv.join('');
}
function hexToArray(hex) {
    if (!hexLookup.dec) {
        buildHexLookup();
    }
    if (typeof hex !== 'string') {
        throw new Error('Expected string containing hex digits');
    }
    if (hex.length % 2) {
        throw new Error('Odd number of hex digits');
    }
    hex = hex.toLowerCase();
    const len = hex.length / 2;
    const result = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        const b = hexLookup.dec[hex[i * 2] + hex[i * 2 + 1]];
        if (b === undefined) {
            throw new Error('Expected hex string');
        }
        result[i] = b;
    }
    return result;
}
/** Generate N random bytes, throws if a secure random source isn't available. */
function secureRandom(length) {
    return rand(length);
}
/** Used in isInstanceOf checks so we don't spam with warnings. */
let didWarn = false;
/** Check if object in instance of class. */
function isInstanceOf(object, someClass) {
    if (object instanceof someClass) {
        return true;
    }
    if (object == null || typeof object !== 'object') {
        return false;
    }
    // not an actual instance but since bundlers can fail to dedupe stuff or
    // multiple versions can be included we check for compatibility if possible
    const className = someClass['__className'] || someClass['abiName'];
    if (!className) {
        return false;
    }
    let instanceClass = object.constructor;
    let isAlienInstance = false;
    while (instanceClass && !isAlienInstance) {
        const instanceClassName = instanceClass['__className'] || instanceClass['abiName'];
        if (!instanceClassName) {
            break;
        }
        isAlienInstance = className == instanceClassName;
        instanceClass = Object.getPrototypeOf(instanceClass);
    }
    if (isAlienInstance && !didWarn) {
        // eslint-disable-next-line no-console
        console.warn(`Detected alien instance of ${className}, this usually means more than one version of @greymass/eosio has been included in your bundle.`);
        didWarn = true;
    }
    return isAlienInstance;
}

export { arrayEquals, arrayEquatableEquals, arrayToHex, hexToArray, isInstanceOf, secureRandom };
//# sourceMappingURL=utils.js.map
