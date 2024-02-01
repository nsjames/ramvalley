
module.exports = async (tester) => {
    const contract = await tester.deploy('ramvalleyram', 'build/contract', {
        addCode: true
    }).catch(err => {
        console.error(err)
        process.exit(1);
    })



}
