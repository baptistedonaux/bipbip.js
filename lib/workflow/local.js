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
        for (let i = 0; i < config.commands.local.length; i++) {
            if (Array.isArray(config.commands.local[i])) {

                promise = promise.then(() => {
                    let promises = [];
                    
                    for (let j = 0; j < config.commands.local[i].length; j++) {
                        promises.push(
                            exec.local(
                                config.internal.write,
                                config.commands.local[i][j],
                                {
                                    cwd: config.workspace,
                                }
                            )
                        );
                    }

                    return Promise.all(promises);
                });
            } else {
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
    }

    promise = promise.then(() => {
        return config;
    });

    return promise;
}