console.clear();
console.group("Snippet: 'Call Bind and Apply'");

(function() {

/*

The Call and Apply Functions

It’s nice to have when you need to control the context of the function, but another common usage is invoking 
Array’s slice method on the arguments keyword to make it a full fledged array. The arguments keyword stores 
all the parameters passed into the function. It stores the indices as incrementing, zero-based numeric properties
and has a property length. However, that’s pretty much it. arguments is classified as an array-like object. 
Here’s how to use slice to transform arguments to an array:
*/

	const borat = function() {
		const argumentsArray = Array.prototype.slice.call(arguments);
		argumentsArray.push("...NOT!");
		console.log(argumentsArray.join(" "));
	};

	//prints out "Pamela, I am no longer attracted to you ...NOT!"
	borat("Pamela,", "I", "am", "no", "longer", "attracted", "to", "you");

/*

What happened here? We asked the Array pseudo-class for its slice method, Array.prototype.slice; 
similar to static methods in other languages. Then, we asked slice to be invoked in the context of arguments.
This works because the arguments variable has all of the basic requirements of an array-like structure for 
slice to be executed correctly. We can imagine slice looping from 0 to arguments.length and calling arguments[i] 
without error, then returning an array with the same contents as arguments. Now we can manipulate the array with 
nice methods like push and join!

*/

	const borat2 = function() {
		const argumentsArray = Array.prototype.slice.apply(arguments);
		argumentsArray.push("...NOT!");
		console.log(argumentsArray.join(" "));
	};

	//prints out "Pamela, I am no longer attracted to you ...NOT!"
	borat2("Pamela,", "I", "am", "no", "longer", "attracted", "to", "you");

/*

One might be tempted to assume that call and apply are interchangeable. And in this situation, they kinda* are 
(*Though call performs better than apply when no arguments are passed in!). The main difference between call and 
apply is the way they accept arguments to be passed into the invoked function, after the context. Apply requires 
arguments to be passed in as a single array, and call requires zero or more arguments as individual, comma 
separated parameters. 

Let’s see this in action.

*/

	const memorize = function(letter, word) {
		console.log(letter + " for " + word);
	};

	//prints "A for apply()"
	memorize.apply(null, ["A", "apply"]);

	//prints "C for call()"
	memorize.call(null, "C", "call");

/*

Notice how the parameters after the context are passed directly into the invoked function. 
Apply is useful when you do not know the exact amount of arguments. Also notice how we passed null in as the context. 
This defaults to setting the context as the global Javascript object. We can override this by adding "use strict"; 
anywhere before our code, enabling “strict mode”. The context will then be null or undefined instead of the global object.

*/

/*

The Bind Function

Like call, bind also sets the given function’s context to the target object and optionally accepts comma separated 
arguments, but it doesn’t invoke it. It’ll return a copy of the function. This function’s context will be readily 
set to the target object, any additional arguments will also be readily passed into the bound function. This can 
prove to be useful when we want to pass in a callback function with the correct scope. A common scenario is when 
we use setTimeOut:

*/

	const foo = {
		message: "I'm bound!",
		bar: function() {
			console.log(this.message);
		}
	};

	foo.bar();
	//prints "I'm bound!"
	setTimeout(foo.bar, 15);
	//prints "undefined"
	setTimeout(foo.bar.bind(foo), 15);
	//prints "I'm bound!"

/*

The first foo.bar() runs fine; the keyword this is correctly set to foo. 
The second foo.bar() within setTimeout will cause us problems. Why does this.message return undefined? 
The method setTimeout itself is being called by the another object, which means that the keyword this will also be 
set to that object. Chances are, this object will not have a property message. We can easily fix this by calling 
bind and passing the correct context in.

*/

}
)();
