"use strict";

const exec = require("../exec.js");

module.exports = (config) => {
    config.internal.write("\n>> Running local commands");

    return _run(config);
};

function _run(config) {
    let promise = new Promise((resolve) => {
        resolve();
    });

    if (config.commands.local.length > 0) {
        const _doPromises = (commands) => {
            let promises = [];
            
            for (let j = 0; j < commands.length; j++) {
                promises.push(
                    exec.local(
                        config.internal.write,
                        {
                            "cmd": commands[j],
                            "label": commands[j].replace(/\n/g, "\\n")
                        },
                        {
                            cwd: config.workspace,
                        }
                    )
                );
            }

            return Promise.all(promises);
        };

        for (let i = 0; i < config.commands.local.length; i++) {
            if (Array.isArray(config.commands.local[i])) {
                promise = promise.then(_doPromises.bind(null, config.commands.local[i]));
            } else {
                promise = promise.then(exec.local.bind(
                        exec,
                        config.internal.write,
                        {
                            "cmd": config.commands.local[i],
                            "label": config.commands.local[i].replace(/\n/g, "\\n")
                        },
                        {
                            cwd: config.workspace,
                        },
                        true
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