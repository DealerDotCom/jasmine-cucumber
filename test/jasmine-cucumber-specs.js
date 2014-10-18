/* globals feature:false, featureSteps: false */
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

feature('jasmine-cucumber: POJO arguments instead of cucumber tables')
  .scenario('should be able to pass an object')
    .given('a person', { name : 'Lance', age : 3 })
    .then('the greeting should be "Hi Lance, you\'re 3"')
  .scenario('should be able to pass an array')
    .given('people', [
      { name : 'Lance', age : 3 },
      { name : 'Lana', age : 2 }
    ])
    .then('the greeting should be "Hi Lance and Lana, you\'re 3 and 2"')
  .scenario('could pass more than one argument - though that isn\t encouraged as it is confusing')
    .given('people as args',
      { name : 'Lance', age : 3 },
      { name : 'Lana', age : 2 }
    )
    .then('the greeting should be "Hi Lance and Lana, you\'re 3 and 2"')
  .scenario('could pass an object and a message through regex - this is also not encouraged as it is confusing')
    .given('"young" people', [
      { name : 'Lance', age : 3 },
      { name : 'Lana', age : 2 }
    ])
    .then('the greeting should be "Hi Lance and Lana, you\'re 3 and 2"')

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
  .given('a person', function(person){
    this.person = person;
  })
  .given('people', function(people){
    this.people = people;
  })
  .given('"(.*)" people', function(typeOfPeople, people){
    this.people = people;
    expect(typeOfPeople).toBe('young');
  })
  .given('people as args', function(person1, person2){
    this.people = [person1, person2];
    // or we could do
    this.people = Array.prototype.slice.call(arguments);
    // but the .given('people', people) // example reads better...
    // this is only to illustrate how it behaves (by chance)
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
  .then('the greeting should be "(.*)"', function(expectedGreeting){
      var greeting = 'Hi {name}, you\'re {age}'
        .replace('{name}', this.person ? this.person.name : this.people.map(function(p){ return p.name; }).join(' and '))
        .replace('{age}', this.person ? this.person.age : this.people.map(function(p){ return p.age; }).join(' and '));

      expect(greeting).toBe(expectedGreeting);
  })
  .then('should be "(.*)"', function(values){
    expect(this.values.join(',')).toBe(values);
  })
  .then('after spy was called', function(){
    expect(afterSpy.calls.count()).toBe(1)
  })
