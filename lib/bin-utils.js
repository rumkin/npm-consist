'use strict';

exports.actionSwitcher = actionSwitcher;
exports.runAction = runAction;

function actionSwitcher(actions) {
    var chain = [];
    return function(action) {
        while (typeof actions[action] === 'string') {
            switch(typeof actions[action]) {
                case 'string':
                let target = actions[action];
                if (chain.indexOf(target) > -1) {
                    throw new Error(`Cycle method alias ${action}`)
                }
                chain.push(action);
                action = target;
                break;
                case 'undefined':
                action = 'usage';
                break;
            }
        }

        return (actions[action] || actions.usage).bind(actions);
    };
}

function runAction(actions, action, argv) {
    return (new Promise(function(resolve, reject){
        var result;
        try {
            result = actionSwitcher(actions)(action)(...argv);
        } catch (err) {
            reject(err);
            return;
        }

        resolve(result);
    }));
}
