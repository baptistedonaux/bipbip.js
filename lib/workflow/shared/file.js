"use strict";

const exec = require("../../exec.js"),
    helper = require("../../helper.js"),
    path   = require("path");

module.exports = (config) => {
    return _run(config)
        .then(_touchAndShare)
        .catch((config) => {
            if (config instanceof Error) {
                throw error;
            }

            return config;
        });
};

function _run(config) {
    if (config.shared.files.length === 0) {
        return Promise.reject(config);
    }

    return Promise.resolve(config);
}

function _touchAndShare(config) {
    let commands = [];

    for (let i = config.shared.files.length - 1; i >= 0; i--) {
        let pathParsed = path.parse(config.shared.files[i]);

        commands.push(helper.mkdir(`${config.internal.server.to}/shared/${pathParsed.dir}`));
        commands.push(helper.touch(`${config.internal.server.to}/shared/${pathParsed.dir}/${pathParsed.base}`));
        commands.push(helper.ln(
            `${config.internal.server.to}/shared/${config.shared.files[i]}`,
            `${config.internal.server.to}/releases/${config.internal.release}/${config.shared.files[i]}`
            ));
    }

    return exec.remote(
        config.internal.write,
        config.internal.server,
        commands.join(" && ")
    ).then(() => {
        return config;
    });
}