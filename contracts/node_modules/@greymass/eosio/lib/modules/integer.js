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
import BN from 'bn.js';
import { isInstanceOf, secureRandom } from './utils.js';
import 'brorand';

/**
 * Binary integer with the underlying value represented by a BN.js instance.
 * Follows C++11 standard for arithmetic operators and conversions.
 * @note This type is optimized for correctness not speed, if you plan to manipulate
 *       integers in a tight loop you're advised to use the underlying BN.js value or
 *       convert to a JavaScript number first.
 */
class Int {
    /**
     * Create a new instance, don't use this directly. Use the `.from` factory method instead.
     * @throws If the value over- or under-flows the integer type.
     */
    constructor(value) {
        const self = this.constructor;
        if (self.isSigned === undefined || self.byteWidth === undefined) {
            throw new Error('Cannot instantiate abstract class Int');
        }
        if (value.gt(self.max)) {
            throw new Error(`Number ${value} overflows ${self.abiName}`);
        }
        if (value.lt(self.min)) {
            throw new Error(`Number ${value} underflows ${self.abiName}`);
        }
        this.value = value;
    }
    /** Largest value that can be represented by this integer type. */
    static get max() {
        return new BN(2).pow(new BN(this.byteWidth * 8 - (this.isSigned ? 1 : 0))).isubn(1);
    }
    /** Smallest value that can be represented by this integer type. */
    static get min() {
        return this.isSigned ? this.max.ineg().isubn(1) : new BN(0);
    }
    /** Add `lhs` to `rhs` and return the resulting value. */
    static add(lhs, rhs, overflow = 'truncate') {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.add(b));
    }
    /** Add `lhs` to `rhs` and return the resulting value. */
    static sub(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.sub(b));
    }
    /** Multiply `lhs` by `rhs` and return the resulting value. */
    static mul(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => a.mul(b));
    }
    /**
     * Divide `lhs` by `rhs` and return the quotient, dropping the remainder.
     * @throws When dividing by zero.
     */
    static div(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }
            return a.div(b);
        });
    }
    /**
     * Divide `lhs` by `rhs` and return the quotient + remainder rounded to the closest integer.
     * @throws When dividing by zero.
     */
    static divRound(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }
            return a.divRound(b);
        });
    }
    /**
     * Divide `lhs` by `rhs` and return the quotient + remainder rounded up to the closest integer.
     * @throws When dividing by zero.
     */
    static divCeil(lhs, rhs, overflow) {
        return Int.operator(lhs, rhs, overflow, (a, b) => {
            if (b.isZero()) {
                throw new Error('Division by zero');
            }
            const dm = a.divmod(b);
            if (dm.mod.isZero())
                return dm.div;
            return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
        });
    }
    /**
     * Can be used to implement custom operator.
     * @internal
     */
    static operator(lhs, rhs, overflow = 'truncate', fn) {
        const { a, b } = convert(lhs, rhs);
        const type = a.constructor;
        const result = fn(a.value, b.value);
        return type.from(result, overflow);
    }
    static from(value, overflow) {
        if (isInstanceOf(value, this)) {
            return value;
        }
        let fromType = this;
        let bn;
        if (isInstanceOf(value, Int)) {
            fromType = value.constructor;
            bn = value.value.clone();
        }
        else if (value instanceof Uint8Array) {
            bn = new BN(value, undefined, 'le');
            if (fromType.isSigned) {
                bn = bn.fromTwos(fromType.byteWidth * 8);
            }
        }
        else {
            if ((typeof value === 'string' && !/[0-9]+/.test(value)) ||
                (typeof value === 'number' && !Number.isFinite(value))) {
                throw new Error('Invalid number');
            }
            bn = BN.isBN(value) ? value.clone() : new BN(value, 10);
            if (bn.isNeg() && !fromType.isSigned) {
                fromType = { byteWidth: fromType.byteWidth, isSigned: true };
            }
        }
        switch (overflow) {
            case 'clamp':
                bn = clamp(bn, this.min, this.max);
                break;
            case 'truncate':
                bn = truncate(bn, fromType, this);
                break;
        }
        return new this(bn);
    }
    static fromABI(decoder) {
        return this.from(decoder.readArray(this.byteWidth));
    }
    static abiDefault() {
        return this.from(0);
    }
    static random() {
        return this.from(secureRandom(this.byteWidth));
    }
    cast(type, overflow = 'truncate') {
        if (this.constructor === type) {
            return this;
        }
        return type.from(this, overflow);
    }
    /** Number as bytes in little endian (matches memory layout in C++ contract). */
    get byteArray() {
        const self = this.constructor;
        const value = self.isSigned ? this.value.toTwos(self.byteWidth * 8) : this.value;
        return value.toArrayLike(Uint8Array, 'le', self.byteWidth);
    }
    /**
     * Compare two integers, if strict is set to true the test will only consider integers
     * of the exact same type. I.e. Int64.from(1).equals(UInt64.from(1)) will return false.
     */
    equals(other, strict = false) {
        const self = this.constructor;
        if (strict === true && isInstanceOf(other, Int)) {
            const otherType = other.constructor;
            if (self.byteWidth !== otherType.byteWidth || self.isSigned !== otherType.isSigned) {
                return false;
            }
        }
        try {
            return this.value.eq(self.from(other).value);
        }
        catch {
            return false;
        }
    }
    /** Mutating add. */
    add(num) {
        this.value = this.operator(num, Int.add).value;
    }
    /** Non-mutating add. */
    adding(num) {
        return this.operator(num, Int.add);
    }
    /** Mutating subtract. */
    subtract(num) {
        this.value = this.operator(num, Int.sub).value;
    }
    /** Non-mutating subtract. */
    subtracting(num) {
        return this.operator(num, Int.sub);
    }
    /** Mutating multiply. */
    multiply(by) {
        this.value = this.operator(by, Int.mul).value;
    }
    /** Non-mutating multiply. */
    multiplying(by) {
        return this.operator(by, Int.mul);
    }
    /**
     * Mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    divide(by, behavior) {
        this.value = this.dividing(by, behavior).value;
    }
    /**
     * Non-mutating divide.
     * @param behavior How to handle the remainder, default is to floor (round down).
     * @throws When dividing by zero.
     */
    dividing(by, behavior) {
        let op = Int.div;
        switch (behavior) {
            case 'ceil':
                op = Int.divCeil;
                break;
            case 'round':
                op = Int.divRound;
                break;
        }
        return this.operator(by, op);
    }
    /**
     * Run operator with C++11 implicit conversion.
     * @internal
     */
    operator(other, fn) {
        let rhs;
        if (isInstanceOf(other, Int)) {
            rhs = other;
        }
        else {
            rhs = Int64.from(other, 'truncate');
        }
        return fn(this, rhs).cast(this.constructor);
    }
    /**
     * Convert to a JavaScript number.
     * @throws If the number cannot be represented by 53-bits.
     **/
    toNumber() {
        return this.value.toNumber();
    }
    toString() {
        return this.value.toString();
    }
    [Symbol.toPrimitive](type) {
        if (type === 'number') {
            return this.toNumber();
        }
        else {
            return this.toString();
        }
    }
    toABI(encoder) {
        encoder.writeArray(this.byteArray);
    }
    toJSON() {
        // match FCs behavior and return strings for anything above 32-bit
        if (this.value.bitLength() > 32) {
            return this.value.toString();
        }
        else {
            return this.value.toNumber();
        }
    }
}
Int.abiName = '__int';
class Int8 extends Int {
}
Int8.abiName = 'int8';
Int8.byteWidth = 1;
Int8.isSigned = true;
class Int16 extends Int {
}
Int16.abiName = 'int16';
Int16.byteWidth = 2;
Int16.isSigned = true;
class Int32 extends Int {
}
Int32.abiName = 'int32';
Int32.byteWidth = 4;
Int32.isSigned = true;
class Int64 extends Int {
}
Int64.abiName = 'int64';
Int64.byteWidth = 8;
Int64.isSigned = true;
class Int128 extends Int {
}
Int128.abiName = 'int128';
Int128.byteWidth = 16;
Int128.isSigned = true;
class UInt8 extends Int {
}
UInt8.abiName = 'uint8';
UInt8.byteWidth = 1;
UInt8.isSigned = false;
class UInt16 extends Int {
}
UInt16.abiName = 'uint16';
UInt16.byteWidth = 2;
UInt16.isSigned = false;
class UInt32 extends Int {
}
UInt32.abiName = 'uint32';
UInt32.byteWidth = 4;
UInt32.isSigned = false;
class UInt64 extends Int {
}
UInt64.abiName = 'uint64';
UInt64.byteWidth = 8;
UInt64.isSigned = false;
class UInt128 extends Int {
}
UInt128.abiName = 'uint128';
UInt128.byteWidth = 16;
UInt128.isSigned = false;
class VarInt extends Int {
    static fromABI(decoder) {
        return new this(new BN(decoder.readVarint32()));
    }
    toABI(encoder) {
        encoder.writeVarint32(Number(this));
    }
}
VarInt.abiName = 'varint32';
VarInt.byteWidth = 32;
VarInt.isSigned = true;
class VarUInt extends Int {
    static fromABI(decoder) {
        return new this(new BN(decoder.readVaruint32()));
    }
    toABI(encoder) {
        encoder.writeVaruint32(Number(this));
    }
}
VarUInt.abiName = 'varuint32';
VarUInt.byteWidth = 32;
VarUInt.isSigned = false;
/** Clamp number between min and max. */
function clamp(num, min, max) {
    return BN.min(BN.max(num, min), max);
}
/**
 * Create new BN with the same bit pattern as the passed value,
 * extending or truncating the value’s representation as necessary.
 */
function truncate(value, from, to) {
    const fill = value.isNeg() ? 255 : 0;
    const fromValue = from.isSigned ? value.toTwos(from.byteWidth * 8) : value;
    const fromBytes = fromValue.toArrayLike(Uint8Array, 'le');
    const toBytes = new Uint8Array(to.byteWidth);
    toBytes.fill(fill);
    toBytes.set(fromBytes.slice(0, to.byteWidth));
    const toValue = new BN(toBytes, undefined, 'le');
    return to.isSigned ? toValue.fromTwos(to.byteWidth * 8) : toValue;
}
/** C++11 implicit integer conversions. */
function convert(a, b) {
    // The integral promotions (4.5) shall be performed on both operands.
    a = promote(a);
    b = promote(b);
    const aType = a.constructor;
    const bType = b.constructor;
    // If both operands have the same type, no further conversion is needed
    if (aType !== bType) {
        // Otherwise, if both operands have signed integer types or both have unsigned integer types,
        // the operand with the type of lesser integer conversion rank shall be converted to the type
        // of the operand with greater rank.
        if (aType.isSigned === bType.isSigned) {
            if (aType.byteWidth > bType.byteWidth) {
                b = b.cast(aType);
            }
            else if (bType.byteWidth > aType.byteWidth) {
                a = a.cast(bType);
            }
        }
        else {
            // Otherwise, if the operand that has unsigned integer type has rank greater than or equal
            // to the rank of the type of the other operand, the operand with signed integer type
            // shall be converted to the type of the operand with unsigned integer type.
            if (aType.isSigned === false && aType.byteWidth >= bType.byteWidth) {
                b = b.cast(aType);
            }
            else if (bType.isSigned === false && bType.byteWidth >= aType.byteWidth) {
                a = a.cast(bType);
            }
            else {
                // Otherwise, if the type of the operand with signed integer type can represent all of the
                // values of the type of the operand with unsigned integer type, the operand with unsigned
                // integer type shall be converted to the type of the operand with signed integer type.
                if (aType.isSigned === true &&
                    aType.max.gte(bType.max) &&
                    aType.min.lte(bType.min)) {
                    b = b.cast(aType);
                }
                else if (bType.isSigned === true &&
                    bType.max.gte(aType.max) &&
                    bType.min.lte(aType.min)) {
                    a = a.cast(bType);
                }
                else ;
            }
        }
    }
    return { a, b };
}
/** C++11 integral promotion. */
function promote(n) {
    // An rvalue of type char, signed char, unsigned char, short int, or
    // unsigned short int can be converted to an rvalue of type int if int
    // can represent all the values of the source type; otherwise, the source
    // rvalue can be converted to an rvalue of type unsigned int.
    let rv = n;
    const type = n.constructor;
    if (type.byteWidth < 4) {
        rv = n.cast(Int32);
    }
    return rv;
}

export { Int, Int128, Int16, Int32, Int64, Int8, UInt128, UInt16, UInt32, UInt64, UInt8, VarInt, VarUInt };
//# sourceMappingURL=integer.js.map
