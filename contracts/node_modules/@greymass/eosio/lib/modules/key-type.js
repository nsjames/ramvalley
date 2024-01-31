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
/** Supported EOSIO curve types. */
var KeyType;
(function (KeyType) {
    KeyType["K1"] = "K1";
    KeyType["R1"] = "R1";
    KeyType["WA"] = "WA";
})(KeyType || (KeyType = {}));
(function (KeyType) {
    function indexFor(value) {
        switch (value) {
            case KeyType.K1:
                return 0;
            case KeyType.R1:
                return 1;
            case KeyType.WA:
                return 2;
            default:
                throw new Error(`Unknown curve type: ${value}`);
        }
    }
    KeyType.indexFor = indexFor;
    function from(value) {
        let index;
        if (typeof value !== 'number') {
            index = KeyType.indexFor(value);
        }
        else {
            index = value;
        }
        switch (index) {
            case 0:
                return KeyType.K1;
            case 1:
                return KeyType.R1;
            case 2:
                return KeyType.WA;
            default:
                throw new Error('Unknown curve type');
        }
    }
    KeyType.from = from;
})(KeyType || (KeyType = {}));

export { KeyType };
//# sourceMappingURL=key-type.js.map
