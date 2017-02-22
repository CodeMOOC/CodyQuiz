#!/usr/bin/env node

var config = require("./config.js");
require("./utility.js")();
var async = require("async");

//=========================================================
// Bot Setup
//=========================================================

var restify = require("restify");
var builder = require("botbuilder");
var fs = require('fs');

// Setup Restify Server
var server = restify.createServer({
    name: "CodyQuiz"
});
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log("%s listening to %s", server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: config.microsoftAppId,
    appPassword: config.microsoftAppPassword
});
var bot = new builder.UniversalBot(connector);
server.post("/codyquiz/api/messages", connector.listen());

//=========================================================
// Database setup
//=========================================================

var mysql = require("mysql");
var dbpool = mysql.createPool({
    connectionLimit:    10,
    host:               config.mysqlHost,
    user:               config.mysqlUser,
    password:           config.mysqlPassword,
    database:           config.mysqlDatabase
});

//=========================================================
// Install middleware
//=========================================================

bot.use({
    botbuilder: function(session, next) {
        console.log("Incoming message: %s", JSON.stringify(session.message));

        // Register and update user
        dbpool.getConnection(function(err, connection) {
            if(err) throw err;

            async.seq(
                function(message, callback) {
                    connection.query("SELECT `id` FROM `identities` WHERE `connector_source` = ? AND `connector_user_id` = ?", [
                        session.message.source,
                        session.message.user.id
                    ], function(err, result, fields) {
                        if(err) throw err;

                        if(result.length >= 1) {
                            callback(null, result[0].id);
                        }
                        else {
                            callback(null, null);
                        }
                    });
                },
                function(identity, callback) {
                    if(identity != null) {
                        connection.query("UPDATE `identities` SET `connector_address` = ?, `last_access_on` = NOW() WHERE `id` = ?", [
                            JSON.stringify(session.message.address),
                            identity
                        ], function(err, result, field) {
                            callback(err, identity);
                        });
                    }
                    else {
                        connection.query("INSERT INTO `identities` (`id`, `connector_source`, `connector_user_id`, `connector_address`, `first_seen_on`, `last_access_on`) VALUES(DEFAULT, ?, ?, ?, NOW(), NOW())", [
                            session.message.source,
                            session.message.user.id,
                            JSON.stringify(session.message.address)
                        ], function(err, result, field) {
                            callback(err, result.insertId);
                        });
                    }
                }
            )(session.message, function(err, result) {
                if(err) throw err;

                session.identity = result;
                console.log("User identity #%d", result);

                connection.release();

                next();
            });
        });
    } //end user identity middleware
});

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog("/", [
    function (session, args, next) {
        session.beginDialog("/quiz");
    }
]);

bot.dialog("/quiz", [
    function (session) {
        var card = new builder.HeroCard(session)
            .title("The question")
            .text("Text of the question here.")
            .images([
                builder.CardImage.create(session, "http://botify.it/treasurehuntbot/riddles/0.png")
            ]);

        var msg = new builder.Message(session)
            .attachments([card]);
        session.send(msg);

        var answers = [
            '7',
            '9',
            '11'
        ];

        builder.Prompts.choice(session, "How many thingies?", answers, {
            maxRetries: 0
        });
    },
    function(session, result) {
        if(result.response && result.response.entity == "7") {
            session.send("Correct!");
        }
        else {
            session.send("Sorry, 7 was the correct answer.");
        }

        builder.Prompts.text(session, "Another one?");
    },
    function(session, result) {
        var affirmations = session.localizer.getEntry(session.preferredLocale(), "affirmation");

        var normalizedResponse = result.response.toString().normalizeResponse();
        console.log("Response %s, normalized %s", result.response, normalizedResponse);

        if(affirmations.includes(normalizedResponse)) {
            session.replaceDialog("/quiz");
        }
        else {
            session.endDialog("Ok then.");
        }
    }
]);

bot.dialog("/help", [
    function(session) {
        session.endDialog("help");
    }
]);
bot.beginDialogAction("help", "/help", { matches: [
    /aiuto/i,
    /^come/i,
    /help/i,
    /^how/i
] });
