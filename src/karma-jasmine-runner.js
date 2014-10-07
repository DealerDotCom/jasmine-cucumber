var origStart = window.__karma__.start;
window.__karma__.start = function(){

    var runner = window.jasmineFeatureRunner(window.features, window.steps);

    window.features.forEach(runner);
    var scenarios = window.features.reduce(function(memo, f){
        return memo + f.scenarios.length;
    }, 0);

    // TODO: how can we output to the console in a "prettier" way?
    console.log('Found ' + window.features.length + ' features with ' + scenarios + ' scenarios');

    origStart.apply(this, arguments);
};