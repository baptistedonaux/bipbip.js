"use strict";

const events = require("events"),
    moment   = require("moment"),
    os       = require("os");

class Logger {
    constructor(callbacks) {
        this.emitter = new events();
        this.user = require("process").env.USER || "";

        this.subscribes(callbacks);
    }

    getEmitter() {
        return this.emitter;
    }

    subscribes(callbacks) {
        for (let event in callbacks) {
            let callback = callbacks[event];

            if (typeof callback == "function") {
                this.getEmitter().on(event, callback);
            }
        }

        return this;
    }

    write(message, server) {
        let hostname = os.hostname(),
            user = this.user;

        if (server !== undefined && server.host !== undefined && server.user !== undefined) {
            hostname = server.host;
            user = server.user;
        }

        this.getEmitter().emit("data", `\x1B[38;5;239m${moment().format("DD/MM/YY HH:mm:ss")} ~ ${user}@${hostname}\t${message}`);
    }

    getWritter() {
        return Logger.prototype.write.bind(this);
    }
}

Logger.buildMessage = function(write, messages) {
    let message = "";

    for (var i = 0; i < messages.length; i++) {
        // http://misc.flogisoft.com/bash/tip_colors_and_formatting
        
        if (messages[i].color == "grey") {
            messages[i].color = "\x1B[30m";
        } else if (messages[i].color == "red") {
            messages[i].color = "\x1B[31m";
        } else if (messages[i].color == "green") {
            messages[i].color = "\x1B[32m";
        } else if (messages[i].color == "orange") {
            messages[i].color = "\x1B[33m";
        } else if (messages[i].color == "blue") {
            messages[i].color = "\x1B[34m";
        } else if (messages[i].color == "purple") {
            messages[i].color = "\x1B[35m";
        } else if (messages[i].color == "mint") {
            messages[i].color = "\x1B[36m";
        } else {
            messages[i].color = "\x1B[0m";
        }

        message += `${messages[i].color}${messages[i].message}\x1B[39m `;
    }

    write(message);
};

module.exports = Logger;
