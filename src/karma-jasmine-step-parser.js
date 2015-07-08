(function(exports){
	
	function StepParser(keyWord, description, parameters){
		this.keyWord = keyWord;
		this.description = description;
		this.parameters = parameters ? parameters[0] : null;
		
		if (this.parameters && !Array.isArray(this.parameters)) { 
			this.parameters = [this.parameters];
		}
	}
	
	StepParser.NewLine = '\n\t | ';
	StepParser.Separator = ' | ';
	
	StepParser.prototype.getParametersNames = function(){
		return Object.keys(this.parameters[0]);
	}
	
	StepParser.prototype.getParameterMaxLength = function(paramKey){
		return this.parameters.map(function(param){
			return param[paramKey];
		}).reduce(function (longest, entry) {
			return entry.length > longest ? entry.length : longest;
		}, paramKey.length);
	}
	
	StepParser.prototype.formatParameter = function(key, value){
		var paramKeys = this.getParametersNames();
		var length = this.getParameterMaxLength(key, paramKeys);
		var padding = new Array(length).join(' ');
		return (padding + value).slice(-1 * length) + StepParser.Separator;
	}
	
	StepParser.prototype.stringify = function(){
		var stepFullDescription = this.keyWord + " " + this.description;
		
		if (this.parameters){
			stepFullDescription += this.stringifyParams();
		}
		return stepFullDescription;
	}

	StepParser.prototype.stringifyParams = function(){
		var stepParams = StepParser.NewLine;
		
		var paramKeys = this.getParametersNames();
		
		var self = this;
		paramKeys.forEach(function(key){
			stepParams += self.formatParameter(key, key);
		});
		
		var self = this;
		this.parameters.forEach(function(param){
			stepParams += StepParser.NewLine;
			paramKeys.forEach(function(key){
				stepParams += self.formatParameter(key, param[key]);
			});
		});
		
		return stepParams;
	}
	
    exports.featureStepStringify = function(keyWord, description, parameters){
        return new StepParser(keyWord, description, parameters).stringify();
    };
	
}(typeof window !== 'undefined' ? window : module.exports));