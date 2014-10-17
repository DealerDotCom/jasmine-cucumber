/* globals ddescribe:false */

(function(){
    function levenshteinDistance (a, b) {
        if(a.length === 0) return b.length;
        if(b.length === 0) return a.length;

        var matrix = [];

        // increment along the first column of each row
        var i;
        for(i = 0; i <= b.length; i++){
            matrix[i] = [i];
        }

        // increment each column in the first row
        var j;
        for(j = 0; j <= a.length; j++){
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for(i = 1; i <= b.length; i++){
            for(j = 1; j <= a.length; j++){
                if(b.charAt(i-1) == a.charAt(j-1)){
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                        Math.min(matrix[i][j-1] + 1, // insertion
                                matrix[i-1][j] + 1)); // deletion
                }
            }
        }

        return matrix[b.length][a.length];
    }

    function jasmineFeatureRunner(feature, steps, features){
        var relevantFeatureSteps = steps.filter(function(item){
            return item.pattern.test(feature.description);
        });
        feature.steps = relevantFeatureSteps.reduce(function(reduce, item){
            return reduce.concat(item.steps);
        }, []);
        feature.beforeSteps = relevantFeatureSteps.reduce(function(reduce, item){
            return reduce.concat(item.beforeSteps);
        }, []);
        feature.afterSteps = relevantFeatureSteps.reduce(function(reduce, item){
            return reduce.concat(item.afterSteps);
        }, []);
        var scenarios = feature.scenarios.filter(function(item){
            return item.isOnly;
        });
        // if we have no scenarios to run specifically (isOnly) then run them all
        if (scenarios.length === 0){
            // then run them all
            scenarios = feature.scenarios.filter(function(item){
                return !item.never;
            });
        }
        scenarios.forEach(function(scenario){
            var missingSteps = [],
                ambiguousSteps = [];

            describe('\nFeature: ' + feature.description, function(){
                var desc = scenario.isOnly ? ddescribe : describe;
                desc('\nScenario: ' + scenario.description + '\n', getScenarioRunner(scenario));
            });

            function getScenarioRunner(scenario){
                var steps = scenario.beforeSteps.map(function(definition){
                  return {
                    description : '',
                    step  : function(scenarioContext){
                      definition.call(scenarioContext);
                    }
                  };
                })
                .concat(
                  scenario.steps.map(function(scenarioStep){
                    return {
                      // TODO: givens could come after thens - but they are currently bucketed in a way
                      //  where givens are grouped together
                      description : scenarioStep.fullDescription,
                      step : function(scenarioContext){
                        var step = getStep(scenarioStep);
                        if (step && missingSteps.length === 0 && ambiguousSteps.length === 0){
                            step(scenarioContext);
                        }
                      }
                    };
                  })
                )
                .concat(
                  scenario.afterSteps.map(function(definition){
                    return {
                      description : '',
                      step  : function(scenarioContext){
                        definition.call(scenarioContext);
                      }
                    };
                  })
                )
                // lastly we need to ensure there weren't any missing steps along the way
                .concat([{
                    description : '',
                    step : function(){
                        if (missingSteps.length > 0){
                            throw new Error('Missing step definitions:\n\t' +
                                missingSteps.map(stepWithLikelyMatch)
                                .join('\n\t'));
                        }
                    }
                }]);

                var description = steps.reduce(function(memo, item){
                  memo += item.description ? '\n' + item.description : '';
                  return memo;
                }, '');

                var scenarioExecuter = function(done){
                  var scenarioContext = {
                        when : function(description){
                            var step = getStep({
                                description : description,
                                arguments : Array.prototype.slice(arguments, 1)
                            });
                            if (step !== noOp){
                                step(scenarioContext);
                            }
                            else{
                                // we are now in the executing phase... and so we need to throw rather than queue into missingSteps
                                throw new Error('failed to find "' + description + '"');
                            }
                        },
                        given : function(){
                            this.when.apply(this, arguments);
                        },
                        then : function(){
                            this.when.apply(this, arguments);
                        },
                        async : function(){
                            isAsync = true;
                            return function(){
                                if (executingStep){
                                    isAsync = false;
                                }
                                else{
                                    executeNextStep();
                                }
                            };
                        }
                    },
                      currentStep = -1,
                      isAsync = false,
                      executingStep = false,
                      executeNextStep = function(){
                          isAsync = false;
                          // if there is a next step
                          if (currentStep + 1 < steps.length){
                              currentStep++;

                              executingStep = true;
                              steps[currentStep].step(scenarioContext);
                              executingStep = false;

                              if(!isAsync){
                                  executeNextStep();
                              }
                          }
                          else {
                              done();
                          }
                      };

                    // start executing steps
                    executeNextStep();



                    
                };

                return function(){
                  it(description, scenarioExecuter);
                };
            }

            function mapDescription(step){
                return step.description;
            }
            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }


            function stepWithLikelyMatch(unknownDescription){
                var candidates = features.reduce(function(memo, feature){
                    return memo.concat(feature.scenarios);
                }, [])
                    .reduce(function(memo, scenario){
                        return memo.concat(scenario.steps.map(mapDescription));
                    }, [])
                    .map(function(item){
                      return item;
                    })
                    .filter(onlyUnique)
                    .filter(function(description){
                        return missingSteps.indexOf(description) === -1;
                    })
                    .map(function(knownDescription){
                        return {
                            description : knownDescription,
                            score : levenshteinDistance(unknownDescription, knownDescription)
                        };
                    })
                    .sort(function(l, r){
                        return l.score - r.score;
                    })
                    .map(function(item){
                        return item.description + ' (' + item.score + ')';
                    })
                    .slice(0,5);
                return unknownDescription + '\n\t\tDid you mean?\n\t\t\t' + candidates.join('\n\t\t\t');
            }

            function noOp(){}

            function getStep(description){
                // look for 1 and only one match step
                var matchingSteps = feature.steps
                    .map(function(item){
                        var result = item.pattern.exec(description.description);
                        return {
                            definition : item.definition,
                            pattern : item.pattern,
                            arguments : result ? result.slice(1).concat(description.arguments) : [],
                            match : !!result
                        };
                    })
                    .filter(function(item){
                        return item.match;
                    });

                if (matchingSteps.length === 0){
                    missingSteps.push(description.description);
                }
                else if (matchingSteps.length > 1){
                    ambiguousSteps.push(description.description);
                }

                if (matchingSteps.length === 1){
                    return function(scenarioContext){
                        // TODO: ideally we could be detecting failed jasmine matcher so that we can include this description 
                        //  as the step that failed. But that is proving to be very difficult requiring custom matchers... 
                        try{
                            matchingSteps[0].definition.apply(scenarioContext, matchingSteps[0].arguments);
                        }
                        catch(e){
                            throw new Error('error while executing "' + description.description + '"\n ' + e.toString() + '\n' + e.stack);
                        }
                    };
                }
                else{
                    return noOp;
                }
            }
        });
    }

    function adapter(features, steps){
        return function(feature){
            return jasmineFeatureRunner(feature, steps, features);
        };
    }

    if (typeof window !== 'undefined'){
        window.jasmineFeatureRunner = adapter;
    }
    else if (typeof module !== 'undefined'){
        module.exports = adapter;
    }
})();