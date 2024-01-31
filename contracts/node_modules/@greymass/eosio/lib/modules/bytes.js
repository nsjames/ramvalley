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
import { isInstanceOf, hexToArray, secureRandom, arrayToHex, arrayEquals } from './utils.js';
import 'brorand';

class Bytes {
    constructor(array = new Uint8Array()) {
        this.array = array;
    }
    /**
     * Create a new Bytes instance.
     * @note Make sure to take a [[copy]] before mutating the bytes as the underlying source is not copied here.
     */
    static from(value, encoding) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        if (typeof value === 'string') {
            return this.fromString(value, encoding);
        }
        if (ArrayBuffer.isView(value)) {
            return new this(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        }
        if (isInstanceOf(value['array'], Uint8Array)) {
            return new this(value['array']);
        }
        return new this(new Uint8Array(value));
    }
    static fromString(value, encoding = 'hex') {
        if (encoding === 'hex') {
            const array = hexToArray(value);
            return new this(array);
        }
        else if (encoding == 'utf8') {
            const encoder = new TextEncoder();
            return new this(encoder.encode(value));
        }
        else {
            throw new Error(`Unknown encoding: ${encoding}`);
        }
    }
    static fromABI(decoder) {
        const len = decoder.readVaruint32();
        return new this(decoder.readArray(len));
    }
    static abiDefault() {
        return new Bytes();
    }
    static equal(a, b) {
        return this.from(a).equals(this.from(b));
    }
    static random(length) {
        return new this(secureRandom(length));
    }
    /** Return true if given value is a valid `BytesType`. */
    static isBytes(value) {
        if (isInstanceOf(value, Bytes) || isInstanceOf(value, Uint8Array)) {
            return true;
        }
        if (Array.isArray(value) && value.every((v) => typeof v === 'number')) {
            return true;
        }
        if (typeof value === 'string' && (/[\da-f]/i.test(value) || value === '')) {
            return true;
        }
        return false;
    }
    /** Number of bytes in this instance. */
    get length() {
        return this.array.byteLength;
    }
    /** Hex string representation of this instance. */
    get hexString() {
        return arrayToHex(this.array);
    }
    /** UTF-8 string representation of this instance. */
    get utf8String() {
        return new TextDecoder().decode(this.array);
    }
    /** Mutating. Append bytes to this instance. */
    append(other) {
        other = Bytes.from(other);
        const newSize = this.array.byteLength + other.array.byteLength;
        const buffer = new ArrayBuffer(newSize);
        const array = new Uint8Array(buffer);
        array.set(this.array);
        array.set(other.array, this.array.byteLength);
        this.array = array;
    }
    /** Non-mutating, returns a copy of this instance with appended bytes. */
    appending(other) {
        const rv = new Bytes(this.array);
        rv.append(other);
        return rv;
    }
    /** Mutating. Pad this instance to length. */
    zeropad(n, truncate = false) {
        const newSize = truncate ? n : Math.max(n, this.array.byteLength);
        const buffer = new ArrayBuffer(newSize);
        const array = new Uint8Array(buffer);
        array.fill(0);
        if (truncate && this.array.byteLength > newSize) {
            array.set(this.array.slice(0, newSize), 0);
        }
        else {
            array.set(this.array, newSize - this.array.byteLength);
        }
        this.array = array;
    }
    /** Non-mutating, returns a copy of this instance with zeros padded. */
    zeropadded(n, truncate = false) {
        const rv = new Bytes(this.array);
        rv.zeropad(n, truncate);
        return rv;
    }
    /** Mutating. Drop bytes from the start of this instance. */
    dropFirst(n = 1) {
        this.array = this.array.subarray(n);
    }
    /** Non-mutating, returns a copy of this instance with dropped bytes from the start. */
    droppingFirst(n = 1) {
        return new Bytes(this.array.subarray(n));
    }
    copy() {
        const buffer = new ArrayBuffer(this.array.byteLength);
        const array = new Uint8Array(buffer);
        array.set(this.array);
        return new Bytes(array);
    }
    equals(other) {
        return arrayEquals(this.array, Bytes.from(other).array);
    }
    toString(encoding = 'hex') {
        if (encoding === 'hex') {
            return this.hexString;
        }
        else if (encoding === 'utf8') {
            return this.utf8String;
        }
        else {
            throw new Error(`Unknown encoding: ${encoding}`);
        }
    }
    toABI(encoder) {
        encoder.writeVaruint32(this.array.byteLength);
        encoder.writeArray(this.array);
    }
    toJSON() {
        return this.hexString;
    }
}
Bytes.abiName = 'bytes';

export { Bytes };
//# sourceMappingURL=bytes.js.map
