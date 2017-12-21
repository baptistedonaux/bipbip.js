"use strict";

const events = require("events");

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

    write(message) {
        this.getEmitter().emit("data", message);
    }

    getWritter() {
        return Logger.prototype.write.bind(this);
    }
}

module.exports = Logger;
