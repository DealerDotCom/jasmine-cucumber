feature('jasmine-cucumber: Should support any order')
  .scenario('can call when after then')
    .given('enqueue "1"')
    .when('enqueue "2"')
    .then('should be "1,2"')
    .when('enqueue "3"')
    .then('should be "1,2,3"')

feature('jasmine-cucumber: should support after')
  .scenario('should call after for first scenario')
    .given('after spy is reset')

  .scenario('should see that after was called from first scenario')
    .then('after spy was called')

feature('jasmine-cucumber: async')
  .scenario('simple async')
    .when('enqueue "1" asynchronously')
    .then('should be "1"')

  .scenario('should not blow up if not really async')
    .when('async test isn\'t really async')



// global b/c scenarioContext is cleared for each scenario
var afterSpy = jasmine.createSpy();
featureSteps('jasmine-cucumber:')
  .before(function(){
    this.values = [];
  })
  .after(afterSpy)
  .given('enqueue "(.*)"', function(val){
    this.values.push(val);
  })
  .given('after spy is reset', function(){
    afterSpy.calls.reset();
  })
  .when('async test isn\'t really async', function(){
    var done = this.async();
    expect(1).toBe(1);
    done();   
  })
  .when('enqueue "(.*)" asynchronously', function(value){
      var done = this.async();
      var scenarioContext = this;

      setTimeout(function(){
          scenarioContext.values.push(value);
          done();
      });
  })
  .then('should be "(.*)"', function(values){
    expect(this.values.join(',')).toBe(values);
  })
  .then('after spy was called', function(){
    expect(afterSpy.calls.count()).toBe(1)
  })
