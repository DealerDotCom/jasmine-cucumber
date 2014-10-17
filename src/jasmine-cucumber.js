(function(exports){
    exports.features = [];
    var featureRunner = {
        enqueue : function(feature){
            exports.features.push(feature);
        }
    };


    function Feature(featureDescription){
        function Scenario(scenarioDescription, options){
            var self = this;
            options = options || {};
            this.description = scenarioDescription;
            this.steps = [];
			this.addStep = function(){
			  var args = Array.prototype.splice.call(arguments, 2);
              this.steps.push({
                description : arguments[1],
                fullDescription : arguments[0] + '  ' + arguments[1] + ' ' + (args && args.length > 0 ? JSON.stringify(args, null, 2) : ''),
                arguments : args
              });
            };

            this.given = function(){
                this.addStep.apply(this, ['Given'].concat(Array.prototype.slice.call(arguments, 0)));

                self.and = function(){
                  this.addStep.apply(this, ['And'].concat(Array.prototype.slice.call(arguments, 0)));
                  return self;
                };

                return self;
            };
            this.when = function(){
                self.addStep.apply(this, ['When'].concat(Array.prototype.slice.call(arguments, 0)));

                self.and = function(){
                  self.addStep.apply(this, ['And'].concat(Array.prototype.slice.call(arguments, 0)));
                  return self;
                };

                return self;
            };
            this.then = function(){
                self.addStep.apply(this, ['Then'].concat(Array.prototype.slice.call(arguments, 0)));

                self.and = function(){
                  self.addStep.apply(this, ['And'].concat(Array.prototype.slice.call(arguments, 0)));
                  return self;
                };
                
                return self;
            };

            // could add this.and as a default - but at least this way you don't get and until you use given, when or then
            this.isOnly = options.only === true ? true : false;
            this.never = options.not === true ? true : false;
        }
        Scenario.prototype = this;
        var self = this;

        self.not = {
            scenario : function(){
                return self.scenario.apply(self, Array.prototype.slice.call(arguments, 0).concat({ not : true}));
            }
        };

        self.only = {
            scenario : function(){
                return self.scenario.apply(self, Array.prototype.slice.call(arguments, 0).concat({ only : true}));
            }
        };

        this.description = featureDescription;
        this.scenarios = [];
        exports.scenario = this.scenario = function(scenarioDescription, callback){
            var scenario = new Scenario(scenarioDescription, callback);
            self.scenarios.push(scenario);
            return scenario;
        };
    }
    function feature(featureDescription, callback){
        var f = new Feature(featureDescription, callback);
        featureRunner.enqueue(f);
        return f;
    }
    
    exports.steps = [];
    
    function FeatureSteps(featurePattern, callback){
        this.pattern = new RegExp(featurePattern);
        this.beforeSteps = [];
        this.afterSteps = [];
        this.steps = [];
        this.given = this.when = this.then = function(pattern, definition){
            this.steps.push({pattern : new RegExp('^' + pattern + '$'), definition : definition});
            return this;
        };
        this.before = function(definition){
            this.beforeSteps.push(definition);
            return this;
        };

        this.after = function(definition){
            this.afterSteps.push(definition);
            return this;
        };

        if (callback){
            callback.call(this);
        }
    }

    exports.feature = feature;
    exports.featureSteps = function(featurePattern, callback){
        var featureSteps = new FeatureSteps(featurePattern, callback);
        exports.steps.push(featureSteps);
        return featureSteps;
    };
}(typeof window !== 'undefined' ? window : module.exports));