#!/usr/bin/env node

'use strict';

const npmConsist = require('..');
const argentum = require('argentum');
const _ = require('underscore');
const bin = require('../lib/bin-utils.js');

var argv = process.argv.slice(2);
var action = argv.shift();

if (! action) {
    action = 'usage';
}

var commonAliases = {
    v: 'verbose',
    d: 'debug',
    i: 'continue',
};

var actions = {
    'install'() {
        var argv = [...arguments];
        var args = argentum.parse(argv, {
            aliases: _.extend({}, commonAliases, {
                m: 'missed'
            })
        });

        args = _.extend({
            // Target directory
            dir: process.cwd(),
            // Verbose output
            verbose: false,
            // Continue module if some package was failed
            continue: false,
            // Set debug output
            debug: process.env.DEBUG === '1',
            // Install dependencies
            dependencies: true,
            // install only missed
            missed: false,
            // Only list modules
            list: false
        }, args);


        var options = _.pick(args, [
            'verbose',
            'continue',
            'debug',
            'dependencies',
            'missed',
            'list',
        ]);

        return npmConsist.run(args.dir, options).then(installed => {
            if (installed.length) {
                if (args.verbose) {
                    console.log('Installed: %s', installed.length);
                } else {
                    console.log(installed.join('\n'));
                }
            } else if (args.verbose) {
                console.log('Installed: 0');
            }
        });
    },
    'help': 'usage',
    'usage'(args) {
        console.error('Usage is: npm-consist <action> [options]');
    }
};


bin.runAction(actions, action, argv).then((result) => {
    if (result) {
        process.stdout.write(result);
    }
    process.exit(0);
}, (error) => {
    console.error(error.stack);
    process.exit(1);
});
return;



if ('v' in args) {
    args.verbose = true;
}

if ('d' in args) {
    args.debug = true;
}

if ('i' in args) {
    args.continue = true;
}

if ('l' in args) {
    args.list = true;
}

if ('m' in args) {
    args.missed = args.m;
}

args = Object.assign(
    {
        // Target directory
        dir: process.cwd(),
        // Verbose output
        verbose: false,
        // Continue module if some package was failed
        continue: false,
        // Set debug output
        debug: process.env.DEBUG === '1',
        // Install dependencies
        dependencies: true,
        // install only missed
        missed: false,
        // Only list modules
        list: false
    },
    args
);

var options = _.pick(args, [
    'verbose',
    'continue',
    'debug',
    'dependencies',
    'missed',
    'list',
]);

npmConsist.run(args.dir, options).then(installed => {
    if (installed.length) {
        if (args.verbose) {
            console.log('Installed: %s', installed.length);
        } else {
            console.log(installed.join('\n'));
        }
    } else if (args.verbose) {
        console.log('Installed: 0');
    }

    process.exit(0);
},
error => {
    if (options.debug) {
        console.error(error.stack);
    } else {
        console.error(error.message);
    }
    process.exit(1);
});
