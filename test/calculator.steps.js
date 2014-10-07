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