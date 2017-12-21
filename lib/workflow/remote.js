"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    return _run(config);
};

function _run(config) {
    let promise = new Promise((resolve) => {
        resolve();
    });

    if (config.commands.remote.length > 0) {
        for (let i = 0; i < config.commands.remote.length; i++) {
            promise = promise.then(exec.remote.bind(
                exec,
                config.internal.write,
                config.internal.server,
                `cd ${config.internal.server.to}/releases/${config.internal.release} && ${config.commands.remote[i]}`
            ));
        }
    }

    promise = promise.then(() => {
        return config;
    });

    return promise;
}