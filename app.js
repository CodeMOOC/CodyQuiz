var config = require('./config.js');
var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: config.microsoftAppId,
    appPassword: config.microsoftAppPassword
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session, args, next) {
        if(!session.privateConversationData.type) {
            session.beginDialog('/type');
        }
        else {
            next();
        }
    },
    function(session) {
        session.send('This is default response. You are %s.', session.privateConversationData.type);
    }
]);

bot.dialog('/type', [
    function (session) {
        builder.Prompts.choice(session, 'What are you?', [
            'Human',
            'Robot',
            'Something else'
        ]);
    },
    function(session, result) {
        if(result.response) {
            console.log('You chose: %s (probability %d)', result.response.entity, result.response.score);

            session.privateConversationData.type = result.response.entity;
        }
        else {
            console.log('You chose nothing.');
        }

        session.endDialog('Ok then.');
    }
]);
