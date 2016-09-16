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

    write(message, color, server) {
        if (color == "grey") {
            color = 30;
        } else if (color == "red") {
            color = 31;
        } else if (color == "green") {
            color = 32;
        } else if (color == "orange") {
            color = 33;
        } else if (color == "blue") {
            color = 34;
        } else if (color == "purple") {
            color = 35;
        } else if (color == "mint") {
            color = 36;
        } else {
            color = 0;
        }

        let hostname = os.hostname(),
            user = this.user;

        if (server !== undefined && server.host !== undefined && server.user !== undefined) {
            hostname = server.host;
            user = server.user;
        }

        this.getEmitter().emit("data", `\x1B[${color}m> [${moment().format("DD/MM/YY HH:mm:ss")}] [${user}@${hostname}] ${message}\x1B[39m`);
    }

    getWritter() {
        return Logger.prototype.write.bind(this);
    }
}

module.exports = Logger;
