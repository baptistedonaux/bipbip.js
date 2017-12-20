"use strict";

const buildMessage = require("./logger.js").buildMessage,
    constant = require("./constant.js"),
    exec     = require("./exec.js"),
    helper   = require("./helper.js");

const Bipbip = function(path, env, writter) {
    const write = writter.getWritter(),
        _local = exec.local.bind(undefined, write),
        _remote = exec.remote.bind(undefined, write);

    let kill = function(message) {
        buildMessage(write, [{
            "message": message,
            "color": "red"
        }]);
        process.exit(1);
    };

    Promise.resolve().then(() => {
        // Prepare current configuration
        let fileConfig = require(path).config,
            config = helper.merge(constant.default, fileConfig.default, fileConfig[env]);

        if (config.servers === undefined) {
            kill("servers is required.");
        } else if (Array.isArray(config.servers) === false) {
            kill("servers must be an array");
        }

        for (let i = config.servers.length - 1; i >= 0; i--) {
            let server = config.servers[i];

            if (server.user === undefined || typeof server.user != "string") {
                kill("servers." + i.toString() + ".user must be a string");
            } else if (server.host === undefined || typeof server.host != "string") {
                kill("servers." + i.toString() + ".host must be a string");
            } else if (server.to === undefined || typeof server.to != "string") {
                kill("servers." + i.toString() + ".to must be a string");
            } else if (server.port !== undefined && isNaN(parseInt(server.port, 10)) === true) {
                kill("servers." + i.toString() + ".port must be an integer");
            }

            if (server.port === undefined) {
                config.servers[i] = 22;
            }
        }

        if (typeof config.repository === "object" && config.repository !== null && config.repository.url !== null && (config.repository.branch === null && config.repository.tag === null)) {
            kill("repository.branch or repository.tag is required.");
        }

        config.requirements.local = config.requirements.local.concat(["git", "rsync", "ssh"]);
        config.requirements.remote = config.requirements.remote.concat(["rsync"]);

        return {
            config: config,
            file: path
        };
    }).then((options) => {
        const promises = [];

        for (let i = 0; i < options.config.requirements.local.length; i++) {
            promises.push(
                _local(
                    `which ${options.config.requirements.local[i]} || exit 1`,
                    {},
                    true,
                    true
                )
            );
        }

        for (let i = 0; i < options.config.servers.length; i++) {
            promises.push(
                _local(
                    `ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=no -q -p ${options.config.servers[i].port} ${options.config.servers[i].user}@${options.config.servers[i].host} 'echo "Connection established" && exit'`,
                    {},
                    true,
                    true
                )
            );
        }

        return Promise.all(promises).then(() => options);
    }).then((options) => {
        const promises = [];

        for (let i = 0; i < options.config.requirements.remote.length; i++) {
            for (let j = options.config.servers.length - 1; j >= 0; j--) {
                promises.push(_remote(
                    options.config.servers[j],
                    `which ${options.config.requirements.remote[i]} || exit 1`,
                    undefined,
                    true
                ));
            }
        }

        return Promise.all(promises).then(() => options);
    }).then((options) => {
        return _local('date +"%Y%d%m%H%M%S"', {}, true, true)
            .then((response) => {
                options.config.internal = {
                    release: response.split("\n")[0],
                    write: write,
                    writter: writter,
                };

                return options;
            });
    })
    .then(_run)
    .then(() => {
        writter.getEmitter().emit("end");
    })
    .catch((error) => {
        writter.getEmitter().emit("error", error);
        process.exit(1);
    });
};

function _run(options) {
    return Promise.resolve(options)
        .then(_one.bind(null, "init"))
        .then(_one.bind(null, "local"))
        .then((config) => {
            let configs = [];
            for (let i = 0; i < config.servers.length; i++) {
                let configCloned = JSON.parse(JSON.stringify(config));

                for (let key in config.internal) {
                    configCloned.internal[key] = config.internal[key];
                }
                configCloned.internal.server = config.servers[i];

                configs.push(configCloned);
            }

            return configs;
        })
        .then(_all.bind(null, "send"))
        .then(_all.bind(null, "shared"))
        .then(_all.bind(null, "remote"))
        .then(_all.bind(null, "deploy"))
        .then(_all.bind(null, "postDeploy"))
        .then(_all.bind(null, "clean"));
}

function _all(workflow, configs) {
    let _ = require(`${__dirname}/workflow/${workflow}.js`),
        promises = [];

    for (let i in configs) {
        promises.push(_(configs[i]));
    }

    return Promise.all(promises);
}

function _one(workflow, config) {
    return require(`${__dirname}/workflow/${workflow}.js`)(config);
}

module.exports = Bipbip;
