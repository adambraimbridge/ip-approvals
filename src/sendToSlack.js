const fetch = require('node-fetch');
//const moment = require('moment');

require('dotenv').config()

const secondPeopleAPIcall = (approver) => {

  approver = approver.replace(' ', '.')

  const peopleAPIurl = `https://ip-people.herokuapp.com/api/people/${approver}`

  const options = {
    method: 'GET',
    headers: {
      'apikey': process.env.PEOPLE_API_KEY
    }
  };

  return new Promise((resolve, reject) => {
    fetch(peopleAPIurl, options)
      .then(response => {
        console.log('response number 2', response.statusText)
        return response.json();
      })
      .then(json => {
        console.log('approver slack id', json[0].slack.id)
        resolve({
          approverId: json[0].slack.id,
        })
      })
  })
}

const peopleApiCall = (person) => {
  const peopleAPIurl = `https://ip-people.herokuapp.com/api/people/${person}`

  const options = {
    method: 'GET',
    headers: {
      'apikey': process.env.PEOPLE_API_KEY
    }
  };

  return new Promise((resolve, reject) => {
    fetch(peopleAPIurl, options)
      .then(response => {
        console.log('response', response.statusText)
        return response.json();
      })
      .then(json => {
        console.log('approver name, ', json[0].finance[0].name, ' requester id, ', json[0].slack.id)
        secondPeopleAPIcall(json[0].finance[0].name)
          .then(result => {
            resolve({
              approverId: result.approverId,
              approverName: json[0].finance[0].name,
              requesterId: json[0].slack.id,
              requesterName: json[0].name
            })
          })
      })
      .catch(err => {
        console.log(err)
        return reject(err)
      })
  })
}

module.exports = {
  sendSlackMessage: (details) => {
    console.log(details);
    const { emailAddress, cost, reason, url, calendarYear, travelCost, additionalInfo, uuid } = details

    console.log(`${emailAddress} wants £${cost} for ${reason}`)

    const person = emailAddress.split('@')[0]

    return new Promise((resolve, reject) => {
      console.log('trying to send');

      console.log('people api call')

      peopleApiCall(person)
        .then(result => {

          console.log(result)

          const messageForRequester = {
            // text that appears in Slack notification
            text: `Hi ${result.requesterName}, your approver ${result.approverName} has received your new ${reason} request.\n• Cost: £${cost}\n• Travel/accomodation cost: £${travelCost}\n• Calendar year: ${calendarYear}\n• Booking url: ${url}\n• Additional info: ${additionalInfo}\n• Request id: ${uuid}`,
            channel: `${result.requesterId}`,
            // text that appears in Slack message
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Hi ${result.requesterName}, your approver ${result.approverName} has received your new ${reason} request.\n• Cost: £${cost}\n• Travel/accomodation cost: £${travelCost}\n• Calendar year: ${calendarYear}\n• Url: ${url}\n• Additional info: ${additionalInfo}\n• Request id: ${uuid}`,
                },
              }
            ]
          }

          const messageForApprover = {
            // if testing locally, change channel to a user's Slack id else result.approverId to send to real budget approver.
            channel: `U03E98JJN`,
            // text that appears in the Slack notification
            text: `Hi ${result.approverName}, you have a new ${reason} request from ${result.requesterName}\n• Cost: £${cost}\n• Cost: £${cost}\n• Travel/accomodation cost: £${travelCost}\n• Calendar year: ${calendarYear}\n\n• Url: ${url}• Additional info: ${additionalInfo}\n• Request id: ${uuid}`,
            // text that appears in the Slack id
            blocks: [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": `Hi ${result.approverName}, you have a new ${reason} request from ${result.requesterName}.\n• Cost: £${cost}\n• Travel/accomodation cost: £${travelCost}\n• Calendar year: ${calendarYear}\n• Url: ${url}\n• Additional info: ${additionalInfo}\n• Request id: ${uuid}`
                }
              },
              {
                "type": "actions",
                "block_id": "approvalblock",
                "elements": [
                  {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "Approve"
                    },
                    "style": "primary",
                    "value": "approve"
                  },
                  {
                    "type": "button",
                    "text": {
                      "type": "plain_text",
                      "text": "Deny"
                    },
                    "style": "danger",
                    "value": "deny"
                  }
                ]
              }
            ]
          }

          const slackUrl = "https://slack.com/api/chat.postMessage"

          fetch(slackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN}`
            },
            body: JSON.stringify(messageForApprover)
          })
          .then(response => response.json())
          .then(data =>  {
              console.log('response for approver', data)
              return resolve(data)
            })
            .catch(err => {
              console.log(err)
              return reject(err)
            })

          fetch(slackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN}`
            },
            body: JSON.stringify(messageForRequester)
          })
            .then(response => response.json())
            .then(data => 

            {
              console.log('response for requester', data)
              return resolve(data)
            })
            .catch(err => {
              console.log(err)
              return reject(err)
            })
        })
    })
  }
}