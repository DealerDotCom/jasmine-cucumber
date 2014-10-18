jasmine-cucumber
================

[Getting Started with Karma](https://github.com/DealerDotCom/karma-jasmine-cucumber)

[Getting Started with Protractor](https://github.com/DealerDotCom/protractor-jasmine-cucumber)


# Motivation
The motivation behind this project was to bring the power of cucumber to expressing complex permutations of tests where jasmine alone starts to fail. This isn't to say that you should no longer use jasmine syntax in favor of this syntax, instead you should leverage this when your jasmine tests start getting too complex and you find yourself copying and / or moving lots of code around. 

Personally, I have found that after about 50 tests jasmine starts to go down hill. You can refactor your tests to reduce the duplication but then the tests become high maintenance and still tend to be brittle. Cucumber provides a nice syntax for managing this level of complexity by making it easy to re-use a step definition in an almost infinite number of combinations, with the only duplication being human readable scenarios. 

In short, unit tests likely still make sense in Jasmine and would be hard to write in a GWT style. Integration tests (integrating multiple units) is where this will shine. 

*What about cucumberjs?* I haven't spent a lot of effort trying to make cucumberjs work - but it has the extra layer of translating non js files into js which adds complexity (it isn't **just** javascript). Personally I have not found this added complexity to be worth it. It was also very important to me that 1 step be able to abstract away other steps (see nested steps below). Which is difficult/ discouraged in the cucumber implementations I have used. 

#API
I recommend splitting your files into specs and steps, here is an example specs.js file

```javascript
	feature('Calculator: add')
	    .scenario('should be able to add 2 numbers together')
    	    .when('I enter "1"')
        	.and('I add "2"')
	        .then('I should get "3"')
    	.scenario('should be able to add to a result of a previous addition')
        	.given('I added "1" and "2"')
	        .when('I add "3"')
    	    .then('I should get "6"')
```
    	    
and steps.js file
	
```javascript
	featureSteps('Calculator:')
	    .before(function(){
    	    this.values = [];
        	this.total = null;
	    })
    	.given('I added "(.*)" and "(.*)"', function(first, second){
        	this.when('I enter "' + first + '"');
	        this.when('I add "' + second + '"');
    	})
	    .when('I enter "(.*)"', function(val){
    	    this.values.push(val * 1);
	    })
    	.when('I add "(.*)"', function(val){
        	this.values.push(val * 1);
	        this.total = this.values[0] + this.values[1];
    	    this.values = [this.total];
	    })
    	.then('I should get "(.*)"', function(val){
        	expect(this.total).toBe(val * 1);
	    })
```

So what are we doing?

```javascript
	feature('Calculator: add')
```

Creates a feature to run tests and serves 2 functions. 
1) the string is used in output for a failing test
2) when declaring step definition, we use regex against the feature string

```javascript
	.scenario('should be able to add 2 numbers together')
```

Creates a scenario, which really just provides output during a failing test

```javascript
	.when('I enter "1"')
```

Tells jasmine-cucumber to execute the step definition that matches `'I enter "1"'`

```javascript
	.and('I add "2"')
```

Is the same as `when('I add "2"')`. 

*Note:* Given and When are interchangable, thens are special because they are wrapped in a jasmine `it()`. In v2.0 they likely will all be interchangeable. 

Enough about the specs, lets take a look at the steps. 

```javascript
	featureSteps('Calculator:')
```

is using regex to say match all features with `Calculator:`

```javascript
	    .before(function(){
    	    this.values = [];
        	this.total = null;
	    })
```
	   
provides code to run before each assertion, this maps to a jasmine `beforeEach`. `this` is a `scenarioContext` which is reset on every assertion (`then`) and allows us to share state between step definitions

```javascript
	    .when('I enter "(.*)"', function(val){
    	    this.values.push(val * 1);
	    })
```
	    
matches `I enter "1"` making val = `'1'` 
	 
```javascript
    	.when('I add "(.*)"', function(val){
        	this.values.push(val * 1);
	        this.total = this.values[0] + this.values[1];
    	    this.values = [this.total];
	    })
```
	    
matches `I add "2"` 
	    
```javascript
    	.then('I should get "(.*)"', function(val){
        	expect(this.total).toBe(val * 1);
	    })
```

matches `I should get "3"` and does the assertion which is being wrapped in a jasmine `it()`
	    
```javascript
  	.given('I added "(.*)" and "(.*)"', function(first, second){
        	this.when('I enter "' + first + '"');
	        this.when('I add "' + second + '"');
    	})
```

Async is also supported with an api inspired by Grunt. 

```javascript
    	.when('I add "(.*)"', function(val){
        	var done = this.async(),
        	    scenarioContext = this;
        	setTimeout(function(){
        		scenarioContext.values.push(val * 1);
	        	scenarioContext.total = scenarioContext.values[0] + scenarioContext.values[1];
    	    	scenarioContext.values = [scenarioContext.total];
        		done();
        	});
	    })
```
The next step won't be called until the done function is executed. In effect, done calls the next step. 
    	
This step definition is especially cool as it allows us to abstract away other step definitions. This allows the more complex scenario to be more readable with one line instead of 2 (imagine 4 or 5 lines of setup for each scenario in a real world app). It then re-uses the existing steps by simply creating the strings that would match their regex. 

Last thing worth mentioning is the output… 

If you enter a string that doesn't match any regex, the scenario will fail stating that it is missing a step definition: 

	Feature: Calculator: add
    Scenario: should be able to add to a result of a previous addition
     Given  I added "1" and "2"
     When  I add "3"

    Missing step definitions FAILED
      Missing step definitions:
        I get "6"
        
So now we know we need a step definition for 'I get "6"', or do we… it also attempts to find steps that are a close match and will provide a hint in case it already exists… 

    Feature: Calculator: add
    Scenario: should be able to add to a result of a previous addition
     Given  I added "1" and "2"
     When  I add "3"

    Missing step definitions FAILED
      Missing step definitions:
        I get "6"
          Did you mean?
            I should get "3" (8)
            
It is using levenshteinDistance which is very rough, but often its just enough to remind you that you're off by one word or letter.

## Want More… 
Unlike traditional cucumber, you can pass plain javascript objects into your gherkin statements. 

```javascript
	.given('a person', { name : 'Lance', age : 3 })
```

Which is passed to your step definition

```javascript
	.given('a person', function(person){
    	this.person = person;
  	})
```
You can pass any object, even an array

```javascript
	.given('people', [
      { name : 'Lance', age : 3 },
      { name : 'Lana', age : 2 }
    ])
```

In my experience this has been most useful when passing in many properties through regex gets overly verbose, eg: 

```javascript
	.given('a person named "Lance"')
	.given('that person is "3" years old')
	.given('that person has "2" siblings')
```

Repeat this for 4 or 5 scenarios and you will really appreciate 

```javascript
	.given('a person', { name : 'Lance', age : 3, siblings : 2 })
	
```

Special thanks to gregorylimoratto for a pull request to improve the output of failed tests to include these arguments

Gotchas
===

Be careful not to use 'this' inside the inject function, as it will be a different context than your scenario. In this example, we are caching the scenario context at the top level, then using it to grab an $injector.

```javascript
.before(function(){
    var scenarioContext = this;

    module('i18n');
    inject(function(_$injector_){
         scenarioContext.$injector = _$injector_;
    });
        
    ...
})
```
# Example
As said previously, jasmine-cucumber won't make sense for every test you have. Where it excels is when the **intent** is getting *lost* in the complexity of the tests themselves. How will a new user (or you in a few months) know what the intent is of the test that is failing, or where to inject your new scneario or regression? With cucumber, this is easy, the intent is human readable and separated from the implementation. The architecture to manage the complexity is a series of step definitions. There isn't a lot to ramp up to. 

Take these 2 examples

## Before
```javascript
describe('i18n interpolation specs', function(){
    // NOTE: we are testing with $compile instead of $interpolate b/c $compile is upstream and gives us more confidence
    //  that we can interpolate attributes and other scenarios abstracted away from $interpolate
    var $compile,
        scope,
        getWatchCount,
        $interpolate;

    beforeEach(function(){
        module('i18n');
        inject(function(i18nMessageResolver, i18nMessages, _$compile_, $rootScope, _$interpolate_){
            $compile = _$compile_;
            scope = $rootScope.$new(true);
            scope.name = 'Lance';
            $interpolate = _$interpolate_;

            angular.extend(i18nMessages, {
                'greeting.label' : 'Hi',
                'greeting.dynamicLabel' : 'Hi {0}, so glad to see you again!',
                'greeting.moreDynamicLabel' : 'Hi {0}, you\'re {1} years old today!',
                'greeting.multiDynamicLabel' : 'Hi {0}, you are {0}, right?',
                'simple.choice' : '{0} {0,choice,0#cars|1#car|1<cars}',
                'decimal.choice' : '{0,choice,0#none|.5#half|1#one|1.5#one and a half|1.5<lots}',
                'negative.choice' : '{0,choice,-1#negative|0#zero|1#one|1<lots}',
                'dynamic.choice' : '{0,choice,0#no leads|1#1 lead|2#{0} leads}'
            });
            getWatchCount = function(){
                return $rootScope.$$watchers + scope.$$watchers;
            };

        });
    });

    // a series of scenarios
    // left side should be wrapped in any element - (easier to test by calling element.html() so we need any element)
    // right side should be the expected .html() of that element
    var expectations = {
        // nothing to interpolate
        "<p>Hi</p>" : "Hi",

          // a simple label
        "<p>{{@i18n(greeting.label)}}</p>" : "Hi",

        // two simple labels
        "<p>{{@i18n(greeting.label)}} {{@i18n(greeting.label)}}</p>" : "Hi Hi"
    };

    var expectationsWithWatch = {
        // interpolate without i18n
        "<p>{{name}}</p>" : "Lance",

        // a label that is partially dynamic
        "<p>{{@i18n(greeting.dynamicLabel)('Lance')}}</p>" : "Hi Lance, so glad to see you again!",

        // a label that is more dynamic
        "<p>{{@i18n(greeting.moreDynamicLabel)('Lance', 3)}}</p>" : "Hi Lance, you're 3 years old today!",

        // a label with multiple instances of a variable
        "<p>{{@i18n(greeting.multiDynamicLabel)('Lance')}}</p>" : "Hi Lance, you are Lance, right?",

        // a label with choice format (zero)
        "<p>{{@i18n(simple.choice)(0)}}</p>" : "0 cars",

        // a label with choice format (1)
        "<p>{{@i18n(simple.choice)(1)}}</p>" : "1 car",

        // a label with choice format (2)
        "<p>{{@i18n(simple.choice)(2)}}</p>" : "2 cars",

        // a label with choice format negative
        "<p>{{@i18n(negative.choice)(1)}}</p>" : "one",
        "<p>{{@i18n(negative.choice)(-1)}}</p>" : "negative",

        // a label with choice format decimal (.5)
        "<p>{{@i18n(decimal.choice)(.5)}}</p>" : "half",

        // a label with choice format decimal (1.5)
        "<p>{{@i18n(decimal.choice)(1.5)}}</p>" : "one and a half",

        // a label with choice format decimal (>1.5)
        "<p>{{@i18n(decimal.choice)(1.6)}}</p>" : "lots",

        // dynamic.choice
        "<p>{{@i18n(dynamic.choice)(0)}}</p>" : "no leads",
        "<p>{{@i18n(dynamic.choice)(1)}}</p>" : "1 lead",
        "<p>{{@i18n(dynamic.choice)(2)}}</p>" : "2 leads"
    };

    Object.keys(expectations)
    .map(function(key){
        return {
            input : key,
            expected : expectations[key],
            expectedWatches : 0
        };
    })
    .concat(Object.keys(expectationsWithWatch).map(function(key){
        return {
            input : key,
            expected : expectationsWithWatch[key],
            expectedWatches : 1
        };
    }))
    .forEach(function(test){
        it('should interpolate ' + test.input + ' to ' + test.expected, function(){

            var el;
            runs(function(){
                el = $compile(test.input)(scope);
                scope.$digest();
            });
            var nextThreadLoop = false;
            setTimeout(function(){
                nextThreadLoop = true;
            })
            waitsFor(function(){
                return nextThreadLoop;
            });

            runs(function(){
                expect(el.html()).toBe(test.expected);
                expect((scope.$$watchers || []).length).toBe(test.expectedWatches);
            });
        });
    });

    it('should be able to do dynamic interpolation', function(){
        var dynamic = 'greeting.label';
        var output = $interpolate('{{@i18n(' + dynamic + ')}}')();
        expect(output).toBe('Hi');
    });
});

````
## After

```javascript
/* globals feature:false, featureSteps:false, expect:false, runs:false, waitsFor:false */
feature('i18n: shouldn\'t break interpolation')
    .scenario('should still be able to interpolate nothing')
        .when('I compile "<p>Hi</p>"')
        .then('I should get html "Hi"')
        .and('there should be "0" watches')
    .scenario('should still be able to interpolate variable')
        .given('I set scope "name" to "Lance"')
        .when('I compile "<p>{{name}}</p>"')
        .then('I should get html "Lance"')
        .and('there should be "1" watch')

feature('i18n: labels')
    .scenario('should be able to translate a simple label')
        .given('I set message "greeting.label" to "Hi"')
        .when('I compile "<p>{{@i18n(greeting.label)}}</p>"')
        .then('I should get html "Hi"')
        .and('there should be "0" watch')

    .scenario('should be able to translate multiple labels')
        .given('I set message "greeting.label" to "Hi"')
        .when('I compile "<p>{{@i18n(greeting.label)}} {{@i18n(greeting.label)}}</p>"')
        .then('I should get html "Hi Hi"')
        .and('there should be "0" watch')

feature('i18n: labels with place holders')
    .scenario('should be able to inject a value into a label')
        .given('I set message "greeting.label" to "Hi {0}"')
        .and('I set scope "name" to "Lance"')
        .when('I compile "<p>{{@i18n(greeting.label)(name)}}</p>"')
        .then('I should get html "Hi Lance"')
        .and('there should be "1" watch')
    .scenario('should be able to inject multiple values into a label')
        .given('I set message "greeting.label" to "Hi {0}, you are {1} today"')
        .and('I set scope "name" to "Lance"')
        .and('I set scope "age" to "3"')
        .when('I compile "<p>{{@i18n(greeting.label)(name, age)}}</p>"')
        .then('I should get html "Hi Lance, you are 3 today"')
        .and('there should be "1" watch')
    .scenario('should be able to inject the same value more than once')
        .given('I set message "greeting.label" to "Hi {0}, you are {0}, right?"')
        .and('I set scope "name" to "Lance"')
        .when('I compile "<p>{{@i18n(greeting.label)(name, age)}}</p>"')
        .then('I should get html "Hi Lance, you are Lance, right?"')
        .and('there should be "1" watch')

feature('i18n: choice format')
    .scenario('should be get the first choice when providing a value less than the first one')
        .given('I set message "cars" to "{0,choice,0#none|1#a car|1<cars}"')
        .when('I compile "<p>{{@i18n(cars)(-1)}}</p>"')
        .then('I should get html "none"')
        .and('there should be "1" watch')
    .scenario('should be get the first choice when providing a equal to the first one')
        .given('I set message "cars" to "{0,choice,0#none|1#a car|1<cars}"')
        .when('I compile "<p>{{@i18n(cars)(0)}}</p>"')
        .then('I should get html "none"')
        .and('there should be "1" watch')
    .scenario('should be get the first choice when providing a value greater than the first one but less than the second one')
        .given('I set message "cars" to "{0,choice,0#none|1#a car|1<cars}"')
        .when('I compile "<p>{{@i18n(cars)(0.5)}}</p>"')
        .then('I should get html "none"')
        .and('there should be "1" watch')
    ...
    
    /* globals featureSteps:false, module:false, inject:false, expect:false, waitsFor:false, runs:false, spyOn:false */

featureSteps("i18n:")
    .before(function(){
        var scenarioContext = this;

        module('i18n');
        inject(function(_$injector_){
            scenarioContext.$injector = _$injector_;
        });
        var $rootScope = this.$injector.get('$rootScope');
        this.scope = $rootScope.$new(true);
        this.getWatchCount = function(){
            return ($rootScope.$$watchers || []).length + (this.scope.$$watchers || []).length;
        };
        spyOn(this.$injector.get('$log'), 'error');

    })
    .given('I set scope "(.*)" to "(.*)"', function(prop, val){
        this.scope[prop] = val;
    })
    .given('I set message "(.*)" to "(.*)"', function(code, val){
        this.$injector.get('i18nMessages')[code] = val;
    })
    .when('I compile "(.*)"', function(fragment){
        var scenarioContext = this;
        this.scope.$apply(function(){
            scenarioContext.element = scenarioContext.$injector.get('$compile')(fragment)(scenarioContext.scope);
        });
    })
    .then('I should get html "(.*)"', function(html){
        expect(this.element.html()).toBe(html);
    })
    .then('there should be "(.*)" watche?s?', function(watchCount){
        var scenarioContext = this,
            nextThreadLoop = false;
        setTimeout(function(){
            nextThreadLoop = true;
        })
        waitsFor(function(){
            return nextThreadLoop;
        });

        runs(function(){
            expect(scenarioContext.getWatchCount()).toBe(watchCount * 1);
        });
    })
    .then('there should be "(.*)" errors? logged', function(errorCount){
        expect(this.$injector.get('$log').error.callCount).toBe(errorCount * 1);
    });

```

Which has a clearer intent? Which is easier to jump into as a new user? *NOTE:* that I started doing this in traditional jasmine and switched to cucumber when I felt like the intent was getting lost and/or the comlexity warranted it (in this case it was mostly about intent). 

# Release Notes
## v 1.1.0
* added support for arguments passed into gherkin expressions - like cucumber DataTables but better :)
* thanks to gregorylimoratto for the pull request to improve the error handling and expose this hidden feature

## v 1.0.3
* fixed bug where synchronous tests using async function would cause bad state
* fixed bug where missing step wouldn't cause scenario to fail if previous step was async

## v 1.0.2
* fixed bug causing the last step to be skipped

## v 1.0.0
* Added support for Jasmine 2.0 syntax. Breaking change, use v.0.2.0 for Jasmine 1.3 syntax. This is primarily to add support for async. 

## v 0.2.0
Supports Jasmine 1.3
# Roadmap
* look closer at cucumber.js

	
