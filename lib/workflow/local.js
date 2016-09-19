"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    return _run(config);
};

function _run(config) {
    let promise = new Promise((resolve) => {
        resolve();
    });

    if (config.commands.local.length > 0) {
        for (var i = 0; i < config.commands.local.length; i++) {
            promise = promise.then(exec.local.bind(
                    exec,
                    config.internal.write,
                    config.commands.local[i],
                    {
                        cwd: config.workspace,
                    }
                )
            );
        }
    }

    promise = promise.then(() => {
        return config;
    });

    return promise;
}