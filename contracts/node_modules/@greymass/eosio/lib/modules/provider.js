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
/** Default provider that uses the Fetch API to call a single node. */
class FetchProvider {
    constructor(url, options = {}) {
        url = url.trim();
        if (url.endsWith('/'))
            url = url.slice(0, -1);
        this.url = url;
        if (!options.fetch) {
            if (typeof window !== 'undefined' && window.fetch) {
                this.fetch = window.fetch.bind(window);
            }
            else if (typeof global !== 'undefined' && global.fetch) {
                this.fetch = global.fetch.bind(global);
            }
            else {
                throw new Error('Missing fetch');
            }
        }
        else {
            this.fetch = options.fetch;
        }
    }
    async call(path, params) {
        const url = this.url + path;
        const response = await this.fetch(url, {
            method: 'POST',
            body: params !== undefined ? JSON.stringify(params) : undefined,
        });
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        }
        catch {
            // ignore json parse errors
        }
        const headers = {};
        for (const [key, value] of response.headers.entries()) {
            headers[key] = value;
        }
        return { headers, status: response.status, json, text };
    }
}

export { FetchProvider };
//# sourceMappingURL=provider.js.map
