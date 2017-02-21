var config = require('./config.js');
require('./utility.js')();

//=========================================================
// Bot Setup
//=========================================================

var restify = require('restify');
var builder = require('botbuilder');

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
        session.beginDialog('/quiz');
    }
]);

bot.dialog('/quiz', [
    function (session) {
        var card = new builder.HeroCard(session)
            .title("The question")
            .text("Text of the question here.")
            .images([
                builder.CardImage.create(session, 'http://botify.it/treasurehuntbot/riddles/0.png')
            ]);

        var msg = new builder.Message(session)
            .attachments([card]);
        session.send(msg);

        var answers = [
            '7',
            '9',
            '11'
        ];

        builder.Prompts.choice(session, 'How many thingies?', answers, {
            maxRetries: 0
        });
    },
    function(session, result) {
        if(result.response && result.response.entity == '7') {
            session.send('Correct!');
        }
        else {
            session.send('Sorry, 7 was the correct answer.');
        }

        builder.Prompts.text(session, 'Another one?');
    },
    function(session, result) {
        var affirmations = session.localizer.getEntry(session.preferredLocale(), "affirmation");

        var normalizedResponse = result.response.toString().normalizeResponse();
        console.log("Response %s, normalized %s", result.response, normalizedResponse);

        if(affirmations.includes(normalizedResponse)) {
            session.replaceDialog('/quiz');
        }
        else {
            session.endDialog('Ok then.');
        }
    }
]);

bot.dialog('/help', [
    function(session) {
        session.endDialog('help');
    }
]);
bot.beginDialogAction('help', '/help', { matches: [
    /aiuto/i,
    /^come/i,
    /help/i,
    /^how/i
] });
