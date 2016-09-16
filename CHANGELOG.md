## 0.6

0.6 has the same comportement of 0.5 release but improve speed and architecture.

> * Deployment steps are executed in parallel on servers to improve speed (Promise)
> * Add Docker environment to execute test
> * Add Travis test to check commands executed
> * Bipbip core refacto to be run without command (uses it for mocha test)
> * Callback system implemented to retrieve log

## 0.5

> * Deployment multi-server
> * Add Travis test

## 0.4

> * Add possibility do not clone repository and execute immediatly commands in current folder (same folder that bipbip configuration)

## 0.3

> * Simplified proccess to remove old releases
> * Remove async command to run multiple commands in same time (experimental)
> * Clear require

## 0.2

> * Add check configuration
> * Add support merge in cascade (for shared configurations)
> * Add default values and declare few variables like required
> * The release name has been change (from timestamp to YmdHi date format)
> * Async commands has been added (beta)
> * Option to initialize and updates submodules (Git)
> * SSH connection don't check the host
> * Post deploy command support
> * Deploy tag (git) added (user has choice to deploy branch or tag)

## 0.1

> * First release. Can be deploy with simple copy and execute local and remote commands.
