const { sendSlackMessage } = require('./sendToSlack');
const { callLambda } = require('./invokeLambda');
exports.handler = async (event) => {
	const eventBody = JSON.parse(event.Records[0].body);
    const content = JSON.parse(eventBody.Message).content;
    const objectString = content.match(/\{([\s\S]*?)\}/g);
    const finalObject = JSON.parse(objectString[0].replace(/(\r\n|\n|\r)/gm, ""));


    // console.log('processing sqs')
    // console.log(finalObject)
    // console.log(`email is ${finalObject.emailAddress}`)
    // console.log(`cost is ${finalObject.cost}`)

    sendSlackMessage(finalObject);

    // callLambda()
};