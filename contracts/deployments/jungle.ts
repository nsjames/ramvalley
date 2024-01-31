
module.exports = async (tester) => {
    const contract = await tester.deploy('<YOUR_CONTRACT_HERE>', 'build/contract', {
        addCode: true
    }).catch(err => {
        console.error(err)
        process.exit(1);
    })



}
