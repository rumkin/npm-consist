'use strict';

const fs = require('fs');
const path = require('path');
const pify = require('pify');
const fsp = pify(fs);
const _ = require('underscore');
const spawnSync = require('child_process').spawnSync;

exports.run = npmConsist;
exports.listInstalled = listInstalledPackages;

function npmConsist(dir, options) {
    var pkgPath = path.resolve(dir, 'package.json');

    return (new Promise((resolve, reject) => {
        fs.exists(pkgPath, (exists) => {
            if (! exists) {
                reject(new Error(''));
            } else {
                resolve();
            }
        });
    }))
    .then(() => readPackage(pkgPath))
    .then(pkg => listWithPackage(dir, pkg, options))
    .then(deps => {
        if (options.missed) {
            return listInstalledPackages(dir, options)
            .then(list => {
                var index = _.indexBy(list, 'name');
                return deps.filter(name => !(name in index));
            });
        } else {
            return deps;
        }
    })
    .then(deps => {
        if (options.list) {
            return deps;
        }

        return installPackages(dir, deps, options)
    })
    ;
}

function readPackage(pkgPath) {
    return fsp.readFile(pkgPath, 'utf8')
    .then(content => {
        try {
            return JSON.parse(content);
        } catch (err) {
            throw new Error(`Package content is not a valid JSON: '${pkgPath}'.`);
        }
    });
}

function listWithPackage(dir, pkg, options) {
    var opts = Object.assign({}, options || {dependencies: true});
    var deps = [];

    if (opts.dependencies) {
        deps.push(...listPkgDependencies(pkg, 'dependencies'));
    }

    if (opts.devDependencies) {
        deps.push(...listPkgDependencies(pkg, 'devDependencies'));
    }

    if (opts.optionalDependencies) {
        deps.push(...listPkgDependencies(pkg, 'optionalDependencies'));
    }

    return _.uniq(deps);
}

function listInstalledPackages(dir, options) {
    var dir_ = path.join(dir, 'node_modules');

    return exists(dir_).then(dirExists => {
        if (! dirExists) {
            return [];
        }

        return fsp.readdir(dir_)
        .then(files => Promise.all(files.map(file => {
            var pkgPath = path.join(dir_, file, 'package.json');

            return exists(pkgPath)
            .then((pkgExists) => {
                if (! pkgExists) {
                    return;
                }

                return fsp.stat(pkgPath)
                .then(stat => {
                    if (! stat.isFile()) {
                        return;
                    }

                    return readPackage(pkgPath).then(pkg => {
                        return {
                            base: dir_,
                            dir: file,
                            path: path.join(dir_, file),
                            name: pkg.name,
                            version: pkg.version,
                            package: pkg,
                            installed: true
                        };
                    })
                    ;
                })
                ;
            })
            ;
        })))
        .then(files => files.filter(file => !!file))
        ;
    });
}

/**
 * Get list of package.json dependencies by it's type dev, optional or regular.
 * @param  {Object} pkg      Package json object.
 * @param  {String} depsType Deps type: 'devDependencies', 'optionalDependencies' or 'dependencies'.
 * @return {string[]}          List of dependencies.
 */
function listPkgDependencies(pkg, depsType) {
    if (depsType in pkg) {
        let deps = pkg[depsType];
        if (_.isObject(deps)) {
            return _.keys(deps);
        }
    }

    return [];

}

function filterMissedPackages(dir, list, options) {
    return Promise.all(list.map(
        name => {
            // TODO (rumkin) get resolve github packages.
            var modulePath = path.resolve(dir, 'node_modules', name);
            return exists(modulePath)
            .then(exists => {
                if (exists) {
                    return null;
                } else {
                    return name;
                }
            });
        }
    ))
    // Filter installed modules
    .then(modules => modules.filter(module => !! module));
}

function installPackages(dir, list, options) {
    for (let pkg of list) {
        if (options.verbose) {
            process.stdout.write('Install: ' + String(pkg));
        }

        var proc = spawnSync('npm', ['install', pkg], {
            stdio: options.debug
                ? 'inherit'
                : null
        });

        if (proc.status) {
            options.verbose && process.stdout.write(' FAIL\n');

            if (! options.continue) {
                if (proc.error) {
                    throw new Error(`Error while installing "${pkg}":` + proc.error);
                }

                throw new Error(`Error status on install "${pkg}"`);
            }
        } else {
            options.verbose && process.stdout.write(' DONE\n');
        }
    }

    return list;
}

function loadPackageInfo(dir, list) {
    return Promise.all(list.map(name => {
        var base = path.join(dir, 'node_modules');
        var pkgPath = path.join(base, name);

        return readPackage(pkgPath)
        .then(pkg => {
            return {
                base: base,
                dir: name,
                path: path.join(base, name),
                name: pkg.name,
                version: pkg.version,
                package: pkg,
                installed: true,
            };
        });
    }))
    ;
}

function exists(filepath) {
    return (new Promise((resolve) => {
        fs.exists(filepath, resolve);
    }));
}
