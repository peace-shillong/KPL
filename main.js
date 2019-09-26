/*
---------- KPL Programming Language ----------
----------------------------------------------
Based on Oak Programming Language build by Clement Mihailescu & Hussein Farah

------------- Overview & Grammar -------------
Kpl is a small language that Clement and Hussein built over the course of a four-day hackathon.
It supports various fundamental programming concepts such as variable-declaration, 
function calling, conditional statements, loops, proper order of operations, and recursion. 
The language syntax is meant to be very readable and intuitive: for instance, every 
function body, conditional statement body, and loop body is wrapped in colons; loops 
follow a "naduh [startingNumber] haduh [endingNumber] da [variable]" syntax; and variable types are
specified upon declaration. Below is the language's EBNF-based grammar, and following that is the code
for the actual interpreter. Starting on line 731 are some examples of programs that the language can run. 
Uncommenting them one by one and pressing the "Run" button above will execute each program, respectively.
-----------------------
--------GRAMMAR--------
-----------------------
program::= variable-declaration | conditional | loop | expression [ program ]
variable-declaration::= variable-keyword variable-name assignment-operator variable-body
variable-keyword::= "fn" | "num" | "str" | "arr" | "bool"
variable-name::= identifier
assignment-operator::= "="
variable-body::= function-declaration | expression | comparison
function-declaration::= function-arguments wrapper function-body wrapper
function-arguments::= "(" [ { expression "," } ] ")"
function-body::= program
conditional::= "lada" comparison wrapper program wrapper [ { "else if" ... } | "hynrei" wrapper program wrapper ]
comparison::= expression [ comparison-operator expression ]
comparison-operator::= "=="
loop::= "naduh" expression "to" expression "with" identifier wrapper program wrapper
expression::= term { "+" | "-" term }
term::= factor { "*" | "/" | "%" factor }
factor::= number | string | boolean | array | identifier | "-" factor | "(" expression ")" | function-call
function-call::= identifier "(" [ { expression "," } ] ")"
identifier::= { letter }
number::= { digit } [ "." { digit } ]
string::= """ [ { * } ] """
array::= "[" [ { expression "," } ] "]" 
boolean::= "true" | "false"
letter::= "a" | "b" | ... | "y" | "z" | "A" | "B" | ... | "Y" | "Z"
digit::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
wrapper::= ":"
---------- KPL Programming Language ----------
----------------------------------------------
---------------- Examples --------------------
*/

// MEMORY SET-UP WITH SOME NATIVE FUNCTIONS

let memory = {   
		shon: {
			isNative: true,
			type: 'fn',
			name:'shon',
			params: [],
			body: (params) => {
				let arrToPrint = [];
				for (var i in params) {
					if(i === '0') continue;
					if (params[i].body) {
						arrToPrint.push(params[i].body);
					} else if (typeof params[i] === 'number') {
						arrToPrint.push(params[i]);
					} else {
						arrToPrint.push(params[i].split('').filter(e => {
							if (e === '"') return false; 
							return true; 
						}).join(''));
					}
				}
				arrToPrint.length === 1 ? console.log(arrToPrint[0]) : console.log(arrToPrint.join(' '));
			}
		},
		push:{
			isNative: true,
			type: 'fn',
			name:'push',
			params: [],
			body: (params) => {
				let thiss = params[0];
				let arrVariable = params[1];
				let thingToPush = params[2];
				if (parseInt(thingToPush)) thingToPush = parseInt(thingToPush);
				if (typeof thingToPush === 'object') thingToPush = thingToPush.body;
				let arrToPushTo = thiss.getVariable(arrVariable.name).body;
				arrToPushTo.push(thingToPush);
				thiss.memory[arrVariable.name].body = arrToPushTo;
				return;
			}
		},
		index:{
			isNative: true,
			type: 'fn',
			name:'index',
			params: [],
			body: (params) => {
				let thiss = params[0];
				let arrVariable = params[1];
				let indexToGet = params[2];
				let returnVal = thiss.getVariable(arrVariable.name).body[indexToGet];
				return returnVal;
			}
		},
	};
	
function Interpreter(memory) {
	
	this.memory = memory;
	
	this.stack = [];
	this.queue = [];
}

/* TOKENIZATION & INPUT METHODS */

Interpreter.prototype.tokenize = function(text) {
    var regex = /\s*(=>|["-+*\][\/\%:\(\)]|[A-Za-z_][A-Za-z0-9_]*|[0-9]*\.?[0-9]+)\s*/g;
    return text.split(regex).filter(function (s) { return !s.match(/^\s*$/); });
};

Interpreter.prototype.prokram = function(text) {
	this.tokens = this.tokenize(text);
  	if (!this.tokens.length) {
    	return "";
  	}
	return this.program();
};

/* MEMORY METHODS */

Interpreter.prototype.getVariable = function(name) { 
	return this.memory[name];	
};

Interpreter.prototype.addVariable = function(type, name, params, body) {
	this.memory[name] = {
		isNative: false,
		name: name,
		type: type,
		params: params,
		body: body
	};		
};

Interpreter.prototype.resetParams = function(name) {
	let func = this.getVariable(name);
	func.params = [];
};

/* CORE METHODS */

Interpreter.prototype.peek = function() {
	return this.tokens[0] || null;
};

Interpreter.prototype.get = function() {
	return this.tokens.shift();
};

Interpreter.prototype.consumeAndRunUntilBreak = function() {
	this.get();
	let returnValue = [];
	while (!this.isWrapper() && this.tokens.length) returnValue.push(this.get());
	let newInterpreter = new Interpreter(this.memory);
	return newInterpreter.prokram(returnValue.join(" "));
};

Interpreter.prototype.consumeUntilFunctionWrapper = function(char, returnType) {
	let returnValue;
	switch(returnType) {
		case "string":
			returnValue = "";
			while (this.peek() !== char) returnValue += this.get();
			break;
		case "array":
			returnValue = [];
			let conditionalKeywords = ["lada", "badlada", "hynrei"],
				isLoopKeywords = ["naduh"],
				wrapperCounter = 0,
				conditionalKeywordCounter = 0,
				testCounter = 0;
			if (char === ":") {
				while (this.peek() !== char || wrapperCounter !== conditionalKeywordCounter * 2 || this.isConditionalKeyword()) {
					
					if (this.isWrapper()) wrapperCounter++;
					if (this.isConditionalKeyword() || this.isLoopKeyword()) conditionalKeywordCounter++;
					returnValue.push(this.get());
					testCounter++;
				}	
			} else {
				while (this.peek() !== char) {
					returnValue.push(this.get());
				}
			}
			break;
		default:
			break;
	}
	
	return returnValue;	
};

Interpreter.prototype.consumeUntil = function(char, returnType) {
	let returnValue;
	switch(returnType) {
		case "string":
			returnValue = "";
			while (this.peek() !== char) returnValue += this.get();
			break;
		case "array":
			returnValue = [];
			let conditionalKeywords = ["lada", "badlada", "hynrei"],
				isLoopKeywords = ["naduh"],
				wrapperCounter = 0,
				conditionalKeywordCounter = 0,
				testCounter = 0;
			if (char === ":") {
				while (this.peek() !== char || wrapperCounter !== conditionalKeywordCounter * 2) {
					
					if (this.isWrapper()) wrapperCounter++;
					if (this.isConditionalKeyword() || this.isLoopKeyword()) conditionalKeywordCounter++;
					returnValue.push(this.get());
					testCounter++;
					
					if (testCounter > 100) break;
				}	
			} else if (char === ")") {
				let openingParenCounter = 0,
					closingParenCounter = 0;
				while (this.peek() !== char || openingParenCounter !== closingParenCounter) {
					if (this.isOpeningParen()) openingParenCounter++;
					if (this.isClosingParen()) closingParenCounter++;
					returnValue.push(this.get());
					testCounter++;
					if (testCounter > 100) break;
				}
			} else {
				while (this.peek() !== char) {
					returnValue.push(this.get());
				}
			}
			break;
		default:
			break;
	}
	
	return returnValue;
};

Interpreter.prototype.replace = function(thingToReplace, thingToReplaceWith, arr) {
	return arr.map(e => {
		if (e === thingToReplace) return thingToReplaceWith;
		return e;
	});
};

Interpreter.prototype.convertArr = function(testArr) {
	let arrToReturn = testArr;
	let openingIndex = testArr.indexOf('['); 
	let closingIndex = testArr.lastIndexOf(']');
	if (openingIndex !== -1) {
		let substr = testArr.substring(openingIndex+1,closingIndex);
		arrToReturn = Array.from(substr).filter(e => {
			if (e === ',' ) return false;
			return true;
		});
	}
	for (var i in arrToReturn) {
		if (parseInt(arrToReturn[i])) arrToReturn[i] = parseInt(arrToReturn[i]);
	}
	return arrToReturn;
}

/* KEYWORD METHODS */

Interpreter.prototype.isFunctionKeyword = function() {
	return this.peek() === "fn";
};

Interpreter.prototype.isVariableKeyword = function() {
	return ["fn", "num", "str", "arr", "bool"].includes(this.peek());	
};

Interpreter.prototype.isConditionalKeyword = function() {
	return ["lada", "badlada", "hynrei"].includes(this.peek());
};

Interpreter.prototype.isLoopKeyword = function() {
	return ["naduh"].includes(this.peek());
};

Interpreter.prototype.getConditionalKeyword = function() {
	return this.peek();
};

Interpreter.prototype.getLoopKeyword = function() {
	return this.peek();
};

/* OPERATOR METHODS */

Interpreter.prototype.isWrapper = function() {
	return this.peek() === ":";
};

Interpreter.prototype.isOpeningArr = function() {
	return this.peek() === "[";	
};

Interpreter.prototype.isClosingArr = function() {
	return this.peek() === "]";	
};

Interpreter.prototype.isStringWrapper = function() {
	return this.peek() === "\"";	
};

Interpreter.prototype.isAssignmentOperator = function() {
	return this.peek() === "=";
};

Interpreter.prototype.isComparisonOperator = function() {
	return this.peek() === "==";	
};

Interpreter.prototype.isTermOperator = function() {
	return "+-".includes(this.peek());	
};

Interpreter.prototype.isFactorOperator = function() {
	return "*/%".includes(this.peek());
};

Interpreter.prototype.isAdditiveInverseOperator = function() {
	return this.peek() === "-";	
};

Interpreter.prototype.isOpeningParen = function() {
	return this.peek() === "(";	
};

Interpreter.prototype.isClosingParen = function() {
	return this.peek() === ")";	
};

Interpreter.prototype.isReturnOperator = function() {
	return this.peek() === "=>";
};

/* PRIMITIVE TYPE METHODS */

Interpreter.prototype.isLetter = function() {
	let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	return letters.includes(this.peek()[0]);
};

Interpreter.prototype.isDigit = function() {
	return "0123456789".includes(this.peek()[0]);
};

Interpreter.prototype.isBoolean = function() {
	return ["true", "false"].includes(this.peek());
};

Interpreter.prototype.getNumber = function() {
	if (!this.isDigit()) {
		return null;
	} else {
		return parseFloat(this.get());
	}
};

Interpreter.prototype.getIdentifier = function() {
	if (!this.isLetter()) {
		return null;
	} else {
		return this.get();
	}
};

/* MAJOR OPERATION METHODS */

Interpreter.prototype.functionCall = function(currentFunction) {
	if (!this.isOpeningParen()) throw new Error("A function call must have arguments wrapped in parentheses!");
	this.get();
	let currentArguments = this.consumeUntil(")", "array");
	if (currentArguments.length) currentArguments = currentArguments.join("").split(",");
	if (!this.isClosingParen()) throw new Error("A function call must have arguments wrapped in parentheses!");
	this.get();
	if (currentFunction.isNative) {
		currentFunction.params.push(this)
		for (let i in currentArguments) {
			let funcName = currentArguments[i].substring(0,currentArguments[i].indexOf('('));
			if (this.getVariable(currentArguments[i])) {
				currentFunction.params.push(this.getVariable(currentArguments[i]));
			}
			else if (this.getVariable(funcName)) {
				let newInterpreter = new Interpreter(this.memory);
				currentFunction.params.push(newInterpreter.prokram(currentArguments[i]));
			}
			else {
				currentFunction.params.push(currentArguments[i]);
			}
		}
		let returnVal = currentFunction.body(currentFunction.params);
		this.resetParams(currentFunction.name);
		
		return returnVal;
	}
	let otherInterpreter = new Interpreter(this.memory);
	let bodyToParse = currentFunction.body.slice(0);
	for (let j = 0; j < currentArguments.length; j++) {
		let currentArgument;
		if (this.getVariable(currentArguments[j]) && this.getVariable(currentArguments[j]).type === "fn") {
			currentArgument = currentArguments[j];
		} else {
			currentArgument = otherInterpreter.prokram(currentArguments[j]) || currentArguments[j];
		}
		let parameterToReplace = currentFunction.params[j].name;
		switch(currentFunction.params[j].type) {
			case "num":
				if (typeof parseFloat(currentArgument) !== "number" || isNaN(parseFloat(currentArgument))) throw new Error("Functions should only be called with parameters of the correct type!");
				break;
			case "str":
				if (currentArgument[0] !== '"') throw new Error("Functions should only be called with parameters of the correct type!");
				break;
			case "bool":
				if (currentArgument !== "true" && currentArgument !== "false") throw new Error("Functions should only be called with parameters of the correct type!");
				break;
			case "fn":
				if (!this.getVariable(currentArgument) || this.getVariable(currentArgument).type !== "fn") throw new Error("Functions should only be called with parameters of the correct type!");
				break;
			case "arr":
				break;
			default:
				throw new Error("Functions should only be called with parameters of the correct type!");
				break;
		}
		bodyToParse = bodyToParse.map(element => {
			if (element === parameterToReplace) {
				return currentArgument;
			} else {
				return element;
			}
		});
	}
	return otherInterpreter.prokram(bodyToParse.join(" "));
};

Interpreter.prototype.factor = function() {
	let factorResult = this.getNumber();
	if (factorResult !== null) {
		return factorResult;
	} else if (this.isStringWrapper()) {
		this.get();
		factorResult = this.consumeUntil('"', "string");
		this.get();
		return factorResult;
	}
	else if (this.isAdditiveInverseOperator()) {
		this.get();
		factorResult = this.factor();
		return -factorResult;
	} else if (this.isOpeningParen()) {
		this.get();
		factorResult = this.expression();
		if (!this.isClosingParen()) throw new Error("Parentheses should always be properly closed!");
		this.get();
		return factorResult;
	} else if (this.isBoolean()) {
		factorResult = this.get();
		return factorResult;
	} else if (this.isOpeningArr()) {
		factorResult = this.peek();
		factorResult = this.consumeUntil(']', "string");
		factorResult += this.peek();
		this.get();
		return factorResult;
	}
	factorResult = this.getIdentifier();
	if (factorResult) {
		let variable = this.getVariable(factorResult);
		if (variable) {
			switch(variable.type) {
				case "fn":
					return this.functionCall(variable);
					break;
				default:
					return variable.body;
					break;
			}
		} else {
			throw new Error(`The identifier ${factorResult} was never declared as a variable!`);
		}
	}
};

Interpreter.prototype.term = function() {
	var termResult = this.factor();
	while (this.isFactorOperator()) {
		if (this.peek() === "*") {
			this.get();
			termResult *= this.factor();
		} else if (this.get() === "/") {
			termResult /= this.factor();	
		} else {
			termResult %= this.factor();
		}
	}
	return termResult;
};

Interpreter.prototype.expression = function() {
	let expressionResult = this.term();
	while (this.isTermOperator()) {
		if (this.get() === "+") {
			expressionResult += this.term();
		} else {
			expressionResult -= this.term();
		}
	}
	return expressionResult;
};

Interpreter.prototype.comparison = function() {
	let firstExpression = this.expression();
	if (this.isComparisonOperator()) {
		this.get();
		return firstExpression === this.expression();
	}
	if (typeof firstExpression !== "boolean") throw new Error("A condition must be a boolean!");
	return firstExpression;
};

/* DECLARATIONS, LOOPS, & CONDITIONALS METHODS */

Interpreter.prototype.functionDeclaration = function() {
	if (!this.isOpeningParen()) throw new Error("A function's parameters should always be wrapped in parentheses!");
	this.get();
	let functionParameters = this.consumeUntil(")", "array");
	let validParameterTypes = ["fn", "num", "str", "arr", "bool"];
	for (let i = 0; i < functionParameters.length; i++) {
		let currentElement = functionParameters[i];
		if (i % 3 === 0 && !["fn", "num", "str", "arr", "bool"].includes(currentElement)) {
			throw new Error("All function parameters must have valid types!");
		} else if (i % 3 === 1) {
			//
		} else if (i % 3 === 2 && currentElement !== ",") {
			throw new Error("All function parameters must be separated by commas!");
		}
	}
	functionParameters = functionParameters.filter(element => element !== ",");
	let actualFunctionParameters = [];
	for (let j = 1; j < functionParameters.length; j += 2) {
		actualFunctionParameters.push({
			type: functionParameters[j - 1],
			name: functionParameters[j]
		})
	}
	if (!this.isClosingParen()) throw new Error("A function's parameters should always be wrapped in parentheses!");
	this.get();
	if (!this.isWrapper()) throw new Error("A function declaration requires an opening wrapper!");
	this.get();
	let functionBody = this.consumeUntilFunctionWrapper(":", "array");
	if (!this.isWrapper()) throw new Error("A function declaration requires a closing wrapper!");
	this.get();
	return [actualFunctionParameters, functionBody];		
};

Interpreter.prototype.variableDeclaration = function() {
	let variableType = this.get(),
		variableName = this.getIdentifier(),
		variableParams = null,
		variableBody;
	if (!this.isAssignmentOperator()) throw new Error("A variable declaration requires a valid assignment operator!");
	this.get();
	switch (variableType) {
		case "fn":
			let functionInformation = this.functionDeclaration();
			variableParams = functionInformation[0];
			variableBody = functionInformation[1];
			break;
		case "num":
			variableBody = this.expression();
			if (typeof variableBody !== "number") throw new Error("The 'num' type requires a valid number!");
			break;
		case "str":
			variableBody = this.expression();
			if (typeof variableBody !== "string") throw new Error("The 'str' type requires a valid string!");
			break;
		case "arr":
			variableBody = this.expression();
			variableBody = this.convertArr(variableBody)
			if (!Array.isArray(variableBody)) throw new Error("The 'arr' type requires a valid array!");
			break;
		case "bool":
			variableBody = this.expression();
			if (typeof variableBody !== "boolean") throw new Error("The 'bool type requires a valid boolean!");
			break;
		default: 
			throw new Error("Variable assignment requires a valid variable type!");
	}
	this.addVariable(variableType, variableName, variableParams, variableBody);
};

Interpreter.prototype.conditional = function() {
	if (this.getConditionalKeyword() !== "lada") {
		this.consumeUntil(":", "array");
	} else {
		this.get();
		let condition = this.comparison();
		while (!condition) {
			if (!this.isWrapper()) throw new Error("A conditional statement requires an opening wrapper!");
			this.get();
			this.consumeUntil(":", "array");
			if (!this.isWrapper()) throw new Error("A conditional statement requires a closing wrapper!");
			this.get();
			if (this.isConditionalKeyword()) {
				if (this.getConditionalKeyword() === "hynrei") {
					this.get();
					if (!this.isWrapper()) throw new Error("A conditional statement requires an opening wrapper!");
					this.get();
					if (this.isReturnOperator()) {
						return this.program();
					} else {
						this.program();
					}
					if (!this.isWrapper()) throw new Error("A conditional statement requires a closing wrapper!");
					this.get();
					break;
				} else if (this.getConditionalKeyword() === "badlada") {
					this.get();
					condition = this.comparison();
				} else {
					break;
				}
			} else {
				break;
			}
		}
		if (condition) {
			if (!this.isWrapper()) throw new Error("A conditional statement requires an opening wrapper!");
			this.get();
			if (this.isReturnOperator()) {
				return this.program();
			} else {
				this.program();
			}
			if (!this.isWrapper()) throw new Error("A conditional statement requires a closing wrapper!");
			this.get();		
		}		
	}

};

Interpreter.prototype.loop = function() {
	let firstIndex, finalIndex, variableName, loopBody;
	if (this.peek() === 'naduh') {
		this.get();
		if (isNaN(this.peek())) throw new Error('naduh loop dei ban sdang da u number!');
		firstIndex = this.get();
		if (this.peek() !== 'haduh') throw new Error('naduh loop dei beit ban don u "haduh" keyword!');
		this.get();
		if (isNaN(parseInt(this.peek()))) throw new Error('U "haduh" keyword dei ban bud da u number!');
		finalIndex = this.get();
		if (this.peek() !== 'da') throw new Error('U naduh loop dei ban don u "da" keyword!');
		this.get();
		if (!this.isLetter()) throw new Error('U "da" keyword dei ban bud da u "identifier" ba dei!');
		variableName = this.get();
		if (!this.isWrapper()) throw new Error('U naduh loop dei ban pynkut bha!');
		this.get();
		loopBody = this.consumeUntil(':', 'array');
		let children = [];
		firstIndex = parseInt(firstIndex);
		finalIndex = parseInt(finalIndex);
		if (firstIndex <= finalIndex) {
			for (var i = firstIndex; i <= finalIndex; i++) {
				children.push(this.replace(variableName, i, loopBody));
			}
		} else if (firstIndex > finalIndex) {
			for (var i = firstIndex; i >= finalIndex; i--) {
				children.push(this.replace(variableName, i, loopBody));
			}
		}
		children.forEach(e => {
			let otherInterpreter = new Interpreter(this.memory);
			otherInterpreter.prokram(e.join(" "));
		});
	} else if (this.peek() === 'while') {
		
	} else {
		throw new Error('Phi bakla ka loop type!');
	}
};

Interpreter.prototype.program = function() {
	while (this.tokens.length) {
		if (this.isVariableKeyword()) {
			this.variableDeclaration();
		} else if (this.isConditionalKeyword()) {
			let possibleReturnValue = this.conditional();
			if (possibleReturnValue !== undefined) return possibleReturnValue;
		} else if (this.isLoopKeyword()) {
			this.loop();
		} else if (this.isReturnOperator()) {
			return this.consumeAndRunUntilBreak();	
		} else {
			let result = this.expression();
			return result;
		}
	}
};


// INTERPRETER INSTANTIATION

let Kpl = new Interpreter(memory)

// BASIC VARIABLE DECLARATION
// Running "Kpl.memory" will show that the newly-declared
// variables are stored in memory.

Kpl.prokram(`
	num one = 1
	num three = 3
	str hello = "hello"
	arr array = [1, 2, 3, 4, 5, 6, 7]
	fn add = (num a, num b) :
		=> a + b
	:
	fn echo = (num a) :
		=> a
	:
	
`)

 //Kpl.memory

// BASIC FUNCTION CALLING

 Kpl.prokram(`
 	add(one, three))
 `)
 

// BASIC lada / hynrei STATEMENTS 
/*
 Kpl.prokram(`
 	lada 3 == 2 :
 		shon("First!")
 	: badlada 1 == 2 :
    	shon("Second!")
  : hynrei :
 		shon("Third!")
 	:
 `)*/

// BASIC naduh haduh LOOPS

 Kpl.prokram(`

 	naduh 0 haduh 6 da i :
 		num currentIndexValue = index(array, i)
 		shon(currentIndexValue)
 	:

 `)

// NESTED naduh TO LOOPS

// Kpl.prokram(`

// 	naduh 1 to 3 with i :
// 		naduh 1 to 3 with j :
// 			naduh 1 to 3 with k :
// 				shon(i, j, k)
// 			:
// 		:
// 	:

// `)

// FIZZBUZZ

// Kpl.prokram(`

// 	fn fizzBuzz = (num n) :
// 		naduh 1 to n with i :
// 			lada i % 15 == 0 :
// 				shon("FizzBuzz")
// 			: badlada i % 5 == 0 :
// 				shon("Buzz")
// 			: badlada i % 3 == 0 :
// 				shon("Fizz")
// 			: else :
// 				shon(i)
// 			:
// 		:
// 	:

// `)

// Kpl.prokram(`

// 	fizzBuzz(35)

// `)

// RECURSION & FIBONACCI

// Kpl.prokram(`

// 	fn fib = (num n) :
// 		lada n == 1 :
// 			=> 0
// 		: badlada n == 2 :
// 			=> 1
// 		: hynrei :
// 			=> fib(n - 1) + fib(n - 2)
// 		:
// 	:

// `)

// Kpl.prokram(`

// 	naduh 1 to 15 with i :
// 		shon(i, fib(i))
// 	:

// `)

// ORDER OF OPERATIONS

// Kpl.prokram(`

// 	fn alwaysTwo = (num n) :
// 		=> ((((n + 47 % (19 * add(-3, 5))) * echo(three - one) - 4) / fib(4) - n + fib(echo(10)) - 29) * 3 - 9) / 3 - (((n + 109 % 10) * 2 - 4) / 2 - n)
// 	:

// `)

// Kpl.prokram(`

// 	alwaysTwo(4751)

// `)
