#!/usr/bin/env node

'use strict';

const npmConsist = require('..');
const argentum = require('argentum');
const _ = require('underscore');
const bin = require('../lib/bin-utils.js');
const Table = require('cli-table');
const chalk = require('chalk');

var argv = process.argv.slice(2);
var action = argv.shift();

if (! action) {
    action = 'usage';
}

const commonAliases = {
    v: 'verbose',
    d: 'debug',
    i: 'continue',
};

const defaults = {
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
};

var actions = {
    'install'() {
        var argv = [...arguments];
        var args = argentum.parse(argv, {
            aliases: _.extend({}, commonAliases, {
                m: 'missed'
            })
        });

        args = _.extend(defaults, args);


        var options = _.pick(args, [
            'verbose',
            'continue',
            'debug',
            'dependencies',
            'missed',
        ]);

        return npmConsist.run(args.dir, options).then(installed => {
            if (args.verbose) {
                console.log('Modules: %s', installed.length);
            }

            if (installed.length) {
                console.log(installed.join('\n'));
            }
        });
    },
    list() {
        var argv = [...arguments];
        var args = argentum.parse(argv, {
            aliases: _.extend({}, commonAliases, {
                m: 'missed',
                t: 'table',
            })
        });

        args = _.extend(defaults, args);

        args.list = true;


        var options = _.pick(args, [
            'verbose',
            'continue',
            'debug',
            'dependencies',
            'missed',
            'list',
        ]);

        return npmConsist.run(args.dir, options).then(list => {
            if (args.verbose) {
                console.log('Modules: %s', list.length);
            }

            if (list.length) {
                if (args.table) {
                    var table = new Table({
                        head: ['Package', 'Version']
                    });

                    if (args.missed) {
                        table.push(...list.map(name => [chalk.bold(name), chalk.grey('-')]));
                        console.log(table.toString());
                    } else {
                        return npmConsist.listInstalled(args.dir, options).then(list => {
                            table.push(...list.map(pkg => [chalk.bold(pkg.name), chalk.grey(pkg.version)]));
                            console.log(table.toString());
                        });
                    }
                } else {
                    console.log(list.join('\n'));
                }
            }
        });
    },
    help(action){
        if (action) {
            if (('help-' + action) in this) {
                this['help-' + action]();
            } else {
                this['help-help']();
            }
        } else {
            this.usage();
        }
    },
    'help-install'() {
        console.error('Install all or missed packages\n');
        console.error('Usage: npm-consist list [OPTIONS]');
        console.error('Options:');
        console.error('\t' + [
            'm,missed - install missed modules',
        ].join('\n\t'));
    },
    'help-list'() {
        console.error('List installed or missed packages\n');
        console.error('Usage: npm-consist list [OPTIONS]');
        console.error('Options:');
        console.error('\t' + [
            'm,missed - list missed modules',
        ].join('\n\t'));
    },
    'help-help'() {
        console.error('Usage: npm-consist help [action]');
        this['list-actions']();
    },
    'usage'(args) {
        console.error('Usage: npm-consist <action> [options]');
        this['list-actions']();
        console.error('Common options:');
        console.error('\t' + [
            'v,verbose - verbose output',
            'd,debug - add debug output',
        ].join('\n\t'));
    },
    'list-actions'() {
        console.error('Actions:');
        console.error('\t' + ['install', 'list', 'help'].join('\n\t'));
    }
};


bin.runAction(actions, action, argv).then((result) => {
    if (_.isNumber(result)) {
        process.exit(result);
        return;
    }

    if (_.isString(result)) {
        process.stdout.write(result);
    }

    process.exit(0);
}, (error) => {
    console.error(error.stack);
    process.exit(1);
});
