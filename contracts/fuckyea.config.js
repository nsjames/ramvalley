module.exports = {
    networks:{
        jungle: {
            // node_url: 'https://eos.greymass.com',
            chain: 'Jungle4',
            accounts: [
                {
                    name: 'ramvalleyram',
                    private_key: process.env.PRIVATE_KEY
                }
            ]
        }
    }
}
