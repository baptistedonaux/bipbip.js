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

        // this.getEmitter().emit("data", `\x1B[7m\x1B[38;5;239m${moment().format("DD/MM/YY HH:mm:ss")} ~ ${user}@${hostname}\x1B[0m\t${message}`);
        this.getEmitter().emit("data", `${message}`);
    }

    getWritter() {
        return Logger.prototype.write.bind(this);
    }
}

module.exports = Logger;
