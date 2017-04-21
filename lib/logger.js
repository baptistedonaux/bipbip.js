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

        this.getEmitter().emit("data", `${moment().format("DD/MM/YY HH:mm:ss")} ~ ${user}@${hostname}\t${message}`);
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
            messages[i].color = 30;
        } else if (messages[i].color == "red") {
            messages[i].color = 31;
        } else if (messages[i].color == "green") {
            messages[i].color = 32;
        } else if (messages[i].color == "orange") {
            messages[i].color = 33;
        } else if (messages[i].color == "blue") {
            messages[i].color = 34;
        } else if (messages[i].color == "purple") {
            messages[i].color = 35;
        } else if (messages[i].color == "mint") {
            messages[i].color = 36;
        } else {
            messages[i].color = 0;
        }

        message += `\x1B[${messages[i].color}m${messages[i].message}\x1B[39m `;
    }

    write(message);
};

module.exports = Logger;
