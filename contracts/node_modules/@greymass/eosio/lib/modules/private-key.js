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
import { z as getCurve, v as Base58, C as Checksum256, g as Signature, a as Checksum512, P as PublicKey } from './client-5963ba48.js';
import { isInstanceOf } from './utils.js';
import { Bytes } from './bytes.js';
import { KeyType } from './key-type.js';
import './integer.js';
import './provider.js';
import 'hash.js';
import 'elliptic';
import 'tslib';
import 'brorand';
import './type-alias.js';
import 'bn.js';

/**
 * Get public key corresponding to given private key.
 * @internal
 */
function getPublic(privkey, type) {
    const curve = getCurve(type);
    const key = curve.keyFromPrivate(privkey);
    const point = key.getPublic();
    return new Uint8Array(point.encodeCompressed());
}

/**
 * Derive shared secret for key pair.
 * @internal
 */
function sharedSecret(privkey, pubkey, type) {
    const curve = getCurve(type);
    const priv = curve.keyFromPrivate(privkey);
    const pub = curve.keyFromPublic(pubkey).getPublic();
    return priv.derive(pub).toArrayLike(Uint8Array, 'be');
}

/**
 * Sign digest using private key.
 * @internal
 */
function sign(secret, message, type) {
    const curve = getCurve(type);
    const key = curve.keyFromPrivate(secret);
    let sig;
    let r;
    let s;
    if (type === 'K1') {
        let attempt = 1;
        do {
            sig = key.sign(message, { canonical: true, pers: [attempt++] });
            r = sig.r.toArrayLike(Uint8Array, 'be', 32);
            s = sig.s.toArrayLike(Uint8Array, 'be', 32);
        } while (!isCanonical(r, s));
    }
    else {
        sig = key.sign(message, { canonical: true });
        r = sig.r.toArrayLike(Uint8Array, 'be', 32);
        s = sig.s.toArrayLike(Uint8Array, 'be', 32);
    }
    return { type, r, s, recid: sig.recoveryParam || 0 };
}
/**
 * Here be dragons
 * - https://github.com/steemit/steem/issues/1944
 * - https://github.com/EOSIO/eos/issues/6699
 * @internal
 */
function isCanonical(r, s) {
    return (!(r[0] & 0x80) &&
        !(r[0] === 0 && !(r[1] & 0x80)) &&
        !(s[0] & 0x80) &&
        !(s[0] === 0 && !(s[1] & 0x80)));
}

/**
 * Generate a new private key for given type.
 * @internal
 */
function generate(type) {
    const curve = getCurve(type);
    const privkey = curve.genKeyPair().getPrivate();
    return privkey.toArrayLike(Uint8Array, 'be', 32);
}

class PrivateKey {
    /** @internal */
    constructor(type, data) {
        if ((type === KeyType.K1 || type === KeyType.R1) && data.length !== 32) {
            throw new Error('Invalid private key length');
        }
        this.type = type;
        this.data = data;
    }
    /** Create PrivateKey object from representing types. */
    static from(value) {
        if (isInstanceOf(value, PrivateKey)) {
            return value;
        }
        else {
            return this.fromString(value);
        }
    }
    /**
     * Create PrivateKey object from a string representation.
     * Accepts WIF (5...) and EOSIO (PVT_...) style private keys.
     */
    static fromString(string, ignoreChecksumError = false) {
        try {
            const { type, data } = decodeKey(string);
            return new this(type, data);
        }
        catch (error) {
            error.message = `Invalid private key (${error.message})`;
            if (ignoreChecksumError &&
                isInstanceOf(error, Base58.DecodingError) &&
                error.code === Base58.ErrorCode.E_CHECKSUM) {
                const type = string.startsWith('PVT_R1') ? KeyType.R1 : KeyType.K1;
                const data = new Bytes(error.info.data);
                if (data.length === 33) {
                    data.dropFirst();
                }
                data.zeropad(32, true);
                return new this(type, data);
            }
            throw error;
        }
    }
    /**
     * Generate new PrivateKey.
     * @throws If a secure random source isn't available.
     */
    static generate(type) {
        return new PrivateKey(KeyType.from(type), new Bytes(generate(type)));
    }
    /**
     * Sign message digest using this key.
     * @throws If the key type isn't R1 or K1.
     */
    signDigest(digest) {
        digest = Checksum256.from(digest);
        return Signature.from(sign(this.data.array, digest.array, this.type));
    }
    /**
     * Sign message using this key.
     * @throws If the key type isn't R1 or K1.
     */
    signMessage(message) {
        return this.signDigest(Checksum256.hash(message));
    }
    /**
     * Derive the shared secret between this private key and given public key.
     * @throws If the key type isn't R1 or K1.
     */
    sharedSecret(publicKey) {
        const shared = sharedSecret(this.data.array, publicKey.data.array, this.type);
        return Checksum512.hash(shared);
    }
    /**
     * Get the corresponding public key.
     * @throws If the key type isn't R1 or K1.
     */
    toPublic() {
        const compressed = getPublic(this.data.array, this.type);
        return PublicKey.from({ compressed, type: this.type });
    }
    /**
     * Return WIF representation of this private key
     * @throws If the key type isn't K1.
     */
    toWif() {
        if (this.type !== KeyType.K1) {
            throw new Error('Unable to generate WIF for non-k1 key');
        }
        return Base58.encodeCheck(Bytes.from([0x80]).appending(this.data));
    }
    /**
     * Return the key in EOSIO PVT_<type>_<base58check> format.
     */
    toString() {
        return `PVT_${this.type}_${Base58.encodeRipemd160Check(this.data, this.type)}`;
    }
    toJSON() {
        return this.toString();
    }
}
/** @internal */
function decodeKey(value) {
    const type = typeof value;
    if (type !== 'string') {
        throw new Error(`Expected string, got ${type}`);
    }
    if (value.startsWith('PVT_')) {
        // EOSIO format
        const parts = value.split('_');
        if (parts.length !== 3) {
            throw new Error('Invalid PVT format');
        }
        const type = KeyType.from(parts[1]);
        let size;
        switch (type) {
            case KeyType.K1:
            case KeyType.R1:
                size = 32;
                break;
        }
        const data = Base58.decodeRipemd160Check(parts[2], size, type);
        return { type, data };
    }
    else {
        // WIF format
        const type = KeyType.K1;
        const data = Base58.decodeCheck(value);
        if (data.array[0] !== 0x80) {
            throw new Error('Invalid WIF');
        }
        return { type, data: data.droppingFirst() };
    }
}

export { PrivateKey };
//# sourceMappingURL=private-key.js.map
