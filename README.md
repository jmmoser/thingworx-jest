# Jest JavaScript Testing Framework for ThingWorx Services

### Installation
1. Create a generic thing and give it a name (e.g. _JestFramework_)
2. Add a new service on the thing
3. Give the service a name (e.g. _importScript_)
3. Set the output of the service to STRING data type
4. Copy the contents of _jest.js_ and paste into the service script text editor
5. Save the service
6. Save the thing

### Usage
After installation, you may reuse this script in any service on any thing/template/shape by including the following snippet at the beginning of the service:

```javascript
/** import { expect, describe, test } */
eval(Things['JestFramework'].importScript())(this); // jshint ignore:line
```

*Note:* I typically create a separate service on each of my things/templates/shapes called *__UNIT_TESTS__ThingName* which runs all of the unit tests for the entity's services.

Add your unit tests after the snippet:
```javascript
describe('Echo service', function() {
  test('Normal input', function() {
    var input = { a: 1 };
    expect(me.EchoService(input)).toEqual(input);
  });
});
```

Then execute the service. If any test fails, an error will be thrown and a descriptive error message will be visible in the output console.


### How This Works
ThingWorx does not allow passing functions as arguments to services so all javascript functions need to be defined inside of the service.  To emulate exporting a script, the entire framework is placed inside of a function and [Function.prototype.toString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/toString) is utillized to get the source code for the function. To emulate importing a script, [eval()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) is utilized to evaluate the source code returned inside of the calling service.  The export of the script source code could be avoided by placing the source string directly in a property and then imported by getting the value of the property instead of calling the service.