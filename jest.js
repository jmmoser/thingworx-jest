/**
 * MIT License
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */



var result = (function (exports) {
    var unitTestResult = {
        "rows": [],
        "dataShape": {
            "fieldDefinitions": {
                "duration": {
                    "name": "duration",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "INTEGER",
                    "ordinal": 7
                },
                "test": {
                    "name": "test",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "STRING",
                    "ordinal": 3
                },
                "pass": {
                    "name": "pass",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "BOOLEAN",
                    "ordinal": 6
                },
                "entityName": {
                    "name": "entityName",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "STRING",
                    "ordinal": 4
                },
                "description": {
                    "name": "description",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "STRING",
                    "ordinal": 2
                },
                "id": {
                    "name": "id",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "STRING",
                    "ordinal": 1
                },
                "error": {
                    "name": "error",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "STRING",
                    "ordinal": 8
                },
                "serviceName": {
                    "name": "serviceName",
                    "aspects": {
                        "isPrimaryKey": false
                    },
                    "description": "",
                    "baseType": "STRING",
                    "ordinal": 5
                }
            }
        }
    };

    exports = exports || this;

    // ⁘ ※ † ‡ • ‖ ⁝ ⁕ ‣ ‧
    // var DOUBLE_NEWLINE = ' ‹|› ';
    var DOUBLE_NEWLINE = ' ‣ ';
    var SINGLE_NEWLINE = ' ‧ ';
    var DID_NOT_THROW = 'Received function did not throw';


    /*********************************
     * Polyfills & Helpers
     * 
     * note - these are not true polyfills as ThingWorx version 8.5 uses Rhino 1.7.11 which does not allow modifying global built-in prototype objects
     * https://support.ptc.com/help/thingworx_hc/thingworx_8_hc/en/index.html#page/ThingWorx%2FHelp%2FComposer%2FThings%2FThingServices%2FRhinoJavaScriptEngine.html
     ********************************/

    /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER */
    Number_MAX_SAFE_INTEGER = 9007199254740991; // Math.pow(2, 53) - 1;

    
    /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN */
    function Number_isNaN(input) {
        return typeof input === 'number' && input !== input;
    }


    /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger */
    function Number_isInteger(value) {
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
    }


    /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger */
    function Number_isSafeInteger(value) {
        return Number_isInteger(value) && Math.abs(value) <= Number_MAX_SAFE_INTEGER;
    }


    /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is */
    function Object_is(x, y) {
        if (x === y) {
            // 0 === -0, but they are not identical
            return x !== 0 || 1 / x === 1 / y;
        }

        // NaN !== NaN, but they are identical.
        // NaNs are the only non-reflexive value, i.e., if x !== x,
        // then x is a NaN.
        // isNaN is broken: it converts its argument to number, so
        // isNaN("foo") => true
        return x !== x && y !== y;
    }


    /** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes */
    function stringIncludes(string, search, start) {
        if (search instanceof RegExp) {
            throw new Error('search argument to String.prototype.includes must not be a RegExp');
        }

        if (start === undefined) {
            start = 0;
        }

        return string.indexOf(search, start) !== -1;
    }


    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }


    function stringify(o) {
        try {
            if (o !== undefined && o !== null) {
                o = twx_Sanitize(o);
                var undefinedKey = '@@_undefined_@@' + uuidv4();
                return JSON.stringify(o, function (k, v) {
                    return v === undefined ? undefinedKey : v;
                }).replace('"' + undefinedKey + '"', 'undefined');
            }
        } catch (err) {
            //
        }
        return '' + o;
    }


    /*********************************
     * ThingWorx Utils
     ********************************/

    function isArrayLike(obj) {
        return Array.isArray(obj) || twx_IsNativeList(obj);
    }


    function twx_IsService(obj) {
        return typeof obj === 'function' && (obj.toString === null || obj.call === null);
    }


    function twx_GetServiceInfo(obj) {
        if (twx_IsService(obj)) {
            try {
                obj(function () { });
            } catch (err) {
                var invalidMatches = /(?:cannot find function )([$A-Z_][0-9A-Z_$]*)(?: in object )([^\s]+)(?:\.)/gmi.exec(err.message);
                if (invalidMatches && invalidMatches.length === 3) {
                    return {
                        valid: false,
                        entityName: invalidMatches[2],
                        serviceName: invalidMatches[1]
                    };
                }
                var matches = /(?:\[)([$A-Z_][0-9A-Z_$]*)(?:\])(?: on )([^\s]+)/gmi.exec(err.message);
                if (matches && matches.length === 3) {
                    return {
                        valid: true,
                        entityName: matches[2],
                        serviceName: matches[1]
                    };
                }
            }
        }
    }


    function twx_IsNativeList(obj) {
        return Object.prototype.toString.call(obj) === '[object NativeListAdapter]';
    }


    function twx_IsInfoTable(obj) {
        return !!(
            Object.prototype.toString.call(obj) === '[object ThingworxInfoTableObject]'
            || (obj && obj.dataShape && isArrayLike(obj.rows))
        );
    }


    // function twx_IsRowObject(obj) {
    //     return Object.prototype.toString.call(obj) === '[object ThingworxRowObject]';
    // }


    function twx_Sanitize(obj, level) {
        if (arguments.length === 1 || level === undefined || level === null || !isNaN(level) || !isFinite(level)) {
            level = 0;
        }
        if (level > 10) {
            return obj;
        }

        if (obj && typeof obj.ToJSON === 'function') {
            obj = JSON.parse('' + obj.ToJSON());
        }

        var i, res;
        if (twx_IsNativeList(obj) || Array.isArray(obj)) {
            res = [];
            for (i = 0; i < obj.length; i++) {
                res.push(twx_Sanitize(obj[i], level + 1));
            }
            return res;
        } else if (obj && typeof obj === 'object') {
            res = {};
            var keys = __keys(obj, __hasKey);
            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                res[key] = twx_Sanitize(obj[key], level + 1);
            }
            return res;
        }
        return obj;
    }



    /*********************************
     * Jasmine Utils
     ********************************/

    /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/jasmineUtils.ts#L196 */
    function __keys(obj, hasKey) {
        function getAllKeys(o) {
            var keys = [];
            for (var key in o) {
                if (hasKey(o, key)) {
                    keys.push(key);
                }
            }
            // var propertySymbols = Object.getOwnPropertySymbols(o).filter(function(symbol) {
            //     return Object.getOwnPropertyDescriptor(o, symbol).enumerable;
            // });
            // for (var propertySymbolsIdx = 0; propertySymbolsIdx < propertySymbols.length; propertySymbolsIdx++) {
            //     keys.push(propertySymbols[propertySymbolsIdx]);
            // }
            return keys;
        }

        var allKeys = getAllKeys(obj);

        // TODO: May need to add custom keys for ThingWorx internal objects (e.g. ThingworxInfoTableObject)
        // throw new Error(Object.prototype.toString.call(obj));
        if (!Array.isArray(obj) && allKeys.length === 0 && typeof obj.ToJSON === 'function') {
            var obj2 = JSON.parse(obj.ToJSON());
            allKeys = getAllKeys(obj2);
        }

        if (!Array.isArray(obj) || allKeys.length === 0) {
            return allKeys;
        }

        var extraKeys = [];
        for (var x = 0; x < allKeys.length; x++) {
            if (typeof allKeys[x] === 'symbol' || !allKeys[x].match(/^[0-9]+$/)) { // jshint ignore:line
                extraKeys.push(allKeys[x]);
            }
        }

        return extraKeys;
    }


    /** Adapted from https://github.com/facebook/jest/blob/116303baf711df37304986897582eb8078aa24d8/packages/expect/src/jasmineUtils.ts#L65 */
    function __eq(a, b, aStack, bStack, customTesters, hasKey) {
        // var asymmetricResult = asymmetricMatch(a, b);
        // if (asymmetricResult !== undefined) {
        //     return asymmetricResult;
        // }

        for (var i = 0; i < customTesters.length; i++) {
            var customTesterResult = customTesters[i](a, b);
            if (customTesterResult !== undefined) {
                return customTesterResult;
            }
        }

        if (a instanceof Error && b instanceof Error) {
            return a.message == b.message;
        }

        if (Object_is(a, b)) {
            return true;
        }

        if (a === null || b === null) {
            return a === b;
        }

        var className = Object.prototype.toString.call(a);
        if (className != Object.prototype.toString.call(b)) {
            return false;
        }

        switch (className) {
            // Strings, numbers, dates, and booleans are compared by value.
            case '[object String]':
                // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                // equivalent to `new String("5")`.
                return a == String(b);
            case '[object Number]':
                return Object_is(Number(a), Number(b));
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a == +b;
            case '[object RegExp]':
                // RegExps are compared by their source patterns and flags.
                return (
                    a.source === b.source &&
                    a.global === b.global &&
                    a.multiline === b.multiline &&
                    a.ignoreCase === b.ignoreCase
                );
        }

        if (typeof a !== 'object' || typeof b !== 'object') {
            return false;
        }

        // Used to detect circular references.
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            // circular references at same depth are equal
            // circular reference is not equal to non-circular one
            if (aStack[length] === a) {
                return bStack[length] === b;
            } else if (bStack[length] === b) {
                return false;
            }
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        var res = true;
        var size = 0;
        // Recursively compare objects and arrays.
        // Compare array lengths to determine if a deep comparison is necessary.
        if (className == '[object Array]') {
            size = a.length;
            if (size !== b.length) {
                return false;
            }

            while (size--) {
                res = __eq(a[size], b[size], aStack, bStack, customTesters, hasKey);
                if (!res) {
                    return false;
                }
            }
        }

        var key;
        var aKeys = __keys(a, hasKey);
        size = aKeys.length;

        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (__keys(b, hasKey).length !== size) {
            return false;
        }

        while (size--) {
            key = aKeys[size];

            // Deep compare each member
            res = hasKey(b, key) && __eq(a[key], b[key], aStack, bStack, customTesters, hasKey);
            if (!res) {
                return false;
            }
        }

        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();

        return res;
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/jasmineUtils.ts#L30 */
    function equals(a, b, customTesters, strictCheck) {
        a = twx_Sanitize(a);
        b = twx_Sanitize(b);
        return __eq(a, b, [], [], customTesters || [], strictCheck === true ? __hasKey : __hasDefinedKey);
    }

    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/jasmineUtils.ts#L239 */
    function __hasKey(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/jasmineUtils.ts#L235 */
    function __hasDefinedKey(obj, key) {
        return __hasKey(obj, key) && obj[key] !== undefined;
    }


    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/jasmineUtils.ts#L243 */
    function isA(typeName, value) {
        return Object.prototype.toString.apply(value) === '[object ' + typeName + ']';
    }


    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/jasmineUtils.ts#L296 */
    // SENTINEL constants are from https://github.com/facebook/immutable-js
    var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
    var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
    var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';


    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/jasmineUtils.ts#L301 */
    function isImmutableUnorderedKeyed(maybeKeyed) {
        return !!(
            maybeKeyed &&
            maybeKeyed[IS_KEYED_SENTINEL] &&
            !maybeKeyed[IS_ORDERED_SENTINEL]
        );
    }


    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/jasmineUtils.ts#L309 */
    function isImmutableUnorderedSet(maybeSet) {
        return !!(
            maybeSet &&
            maybeSet[IS_SET_SENTINEL] &&
            !maybeSet[IS_ORDERED_SENTINEL]
        );
    }


    // var IteratorSymbol = Symbol.iterator;

    /**
     * https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/utils.ts#L148
     * Symbols don't exist so detect by type
     * */
    function hasIterator(obj) {
        // return !!(object != null && object[IteratorSymbol]);
        switch (getType(obj)) {
            case 'map':
            case 'set':
            case 'string':
            case 'array':
                return true;
            default:
                return false;
        }
    }


    /*********************************
     * Custom Testers
     ********************************/

    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/utils.ts#L152 */
    function iterableEquality(a, b, aStack, bStack) {
        if (
            typeof a !== 'object' ||
            typeof b !== 'object' ||
            Array.isArray(a) ||
            Array.isArray(b) ||
            !hasIterator(a) ||
            !hasIterator(b)
        ) {
            return undefined;
        }
        if (a.constructor !== b.constructor) {
            return false;
        }
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            // circular references at same depth are equal
            // circular reference is not equal to non-circular one
            if (aStack[length] === a) {
                return bStack[length] === b;
            }
        }
        aStack.push(a);
        bStack.push(b);

        function iterableEqualityWithStack(a, b) {
            iterableEquality(a, b, aStack.slice(), bStack.slice());
        }

        var allFound, has;

        if (a.size !== undefined) {
            if (a.size !== b.size) {
                return false;
            } else if (isA('Set', a) || isImmutableUnorderedSet(a)) {
                allFound = true;

                var aValues = a.values();
                for (var aValueIdx = 0; aValueIdx < aValues.length; aValueIdx++) {
                    var aValue = aValues[aValueIdx];
                    if (!b.has(aValue)) {
                        has = false;

                        var bValues = b.values();
                        for (var bValueIdx = 0; bValueIdx < bValues.length; bValueIdx++) {
                            var bValue = bValues[bValueIdx];
                            var isEqual = equals(aValue, bValue, [iterableEqualityWithStack]);
                            if (isEqual === true) {
                                has = true;
                            }
                        }

                        if (has === false) {
                            allFound = false;
                            break;
                        }
                    }
                }
                // Remove the first value from the stack of traversed values.
                aStack.pop();
                bStack.pop();
                return allFound;
            } else if (isA('Map', a) || isImmutableUnorderedKeyed(a)) {
                allFound = true;
                var aEntries = a.entries();
                for (var aEntryIdx = 0; aEntryIdx < aEntries.length; aEntryIdx++) {
                    var aEntry = aEntries[aEntryIdx];

                    if (
                        !b.has(aEntry[0]) ||
                        !equals(aEntry[1], b.get(aEntry[0]), [iterableEqualityWithStack])
                    ) {
                        has = false;
                        var bEntries = b.entries();
                        for (var bEntryIdx = 0; bEntryIdx < bEntries.length; bEntryIdx++) {
                            var matchedKey = equals(aEntry[0], bEntry[0], [
                                iterableEqualityWithStack,
                            ]);

                            var matchedValue = false;
                            if (matchedKey === true) {
                                matchedValue = equals(aEntry[1], bEntry[1], [
                                    iterableEqualityWithStack,
                                ]);
                            }
                            if (matchedValue === true) {
                                has = true;
                            }
                        }

                        if (has === false) {
                            allFound = false;
                            break;
                        }
                    }
                }

                // Remove the first value from the stack of traversed values.
                aStack.pop();
                bStack.pop();
                return allFound;
            }
        }


        /** Iterator Symbol not supported in version 8.4 */
        // var bIterator = b[IteratorSymbol]();

        // for (var aValue of a) {
        //     var nextB = bIterator.next();
        //     if (
        //         nextB.done ||
        //         !equals(aValue, nextB.value, [iterableEqualityWithStack])
        //     ) {
        //         return false;
        //     }
        // }
        // if (!bIterator.next().done) {
        //     return false;
        // }

        // Remove the first value from the stack of traversed values.
        aStack.pop();
        bStack.pop();
        return true;
    }


    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/utils.ts#L321 */
    function typeEquality(a, b) {
        if (a == null || b == null || a.constructor === b.constructor) { // jshint ignore:line
            return undefined;
        }

        return false;
    }


    /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/utils.ts#L329 */
    function sparseArrayEquality(a, b) {
        if (!isArrayLike(a) || !isArrayLike(b)) {
            return undefined;
        }

        // A sparse array [, , 1] will have keys ["2"] whereas [undefined, undefined, 1] will have keys ["0", "1", "2"]
        var aKeys = Object.keys(a);
        var bKeys = Object.keys(b);
        return (
            equals(a, b, [iterableEquality, typeEquality], true) && equals(aKeys, bKeys)
        );
    }

    /*********************************
     * Custom Equality Testers
     ********************************/

    var toStrictEqualTesters = [
        iterableEquality,
        typeEquality,
        sparseArrayEquality
    ];

    /*********************************
     * Helper Functions
     ********************************/


    function MatcherResult(pass, messageFunc) {
        return {
            pass: pass,
            message: messageFunc
        };
    }


    /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/jest-matcher-utils/src/index.ts#L430 */
    function matcherHint(matcherName, received, expected, options) {
        received = received !== undefined ? received : 'received';
        expected = expected !== undefined ? expected : 'expected';

        var comment = options.comment || '';
        var isNot = options.isNot || false;
        var isDirectExpectCall = options.isDirectExpectCall || false; // this prop may not be necessary
        var secondArgument = options.secondArgument || '';

        var dimString = 'expect';
        var hint = '';

        if (!isDirectExpectCall && received !== '') {
            hint += dimString + '(' + received;
            dimString = ')';
        }

        if (isNot) {
            hint += dimString + '.' + 'not';
            dimString = '';
        }

        hint += dimString + '.' + matcherName;
        dimString = '';

        if (expected === '') {
            dimString += '()';
        } else {
            hint += dimString + '(' + expected;
            if (secondArgument) {
                hint += ', ' + secondArgument;
            }
            dimString = ')';
        }

        if (comment !== '') {
            dimString += ' // ' + comment;
        }

        if (dimString !== '') {
            hint += dimString;
        }

        return hint;
    }


    /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/jest-get-type/src/index.ts#L26 */
    function getType(value) {
        if (value === undefined) {
            return 'undefined';
        } else if (value === null) {
            return 'null';
        } else if (twx_IsInfoTable(value)) {
            return 'infotable';
        } else if (isArrayLike(value)) {
            return 'array';
        } else if (typeof value === 'boolean') {
            return 'boolean';
        } else if (typeof value === 'function') {
            return 'function';
        } else if (typeof value === 'number') {
            return 'number';
        } else if (typeof value === 'string') {
            return 'string';
        } else if (typeof value === 'bigint') { // jshint ignore:line
            return 'bigint';
        } else if (typeof value === 'object') {
            if (value.constructor === RegExp) {
                return 'regexp';
            } else if (Object.prototype.toString.call(value) === "[object Map]") {
                return 'map';
            } else if (Object.prototype.toString.call(value) === "[object Set]") {
                return 'set';
            } else if (Object.prototype.toString.call(value) === "[object Date]") {
                return 'date';
            }
            return 'object';
        } else if (typeof value === 'symbol') { // jshint ignore:line
            return 'symbol';
        }

        throw new Error('value of unknown type: ' + value);
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/jest-get-type/src/index.ts#L63 */
    function isPrimitive(value) {
        return Object(value) !== value;
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/utils.ts#L346 */
    function isError(value) {
        switch (Object.prototype.toString.call(value)) {
            case '[object Error]':
            case '[object Exception]':
            case '[object DOMExpecption':
                return true;
            default:
                return value instanceof Error;
        }
    }


    /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/expect/src/toThrowMatchers.ts#L54 */
    function getThrown(e) {
        var hasMessage =
            e !== null && e !== undefined && typeof e.message === 'string';

        if (hasMessage && typeof e.name === 'string' && typeof e.stack === 'string') {
            return {
                hasMessage: hasMessage,
                isError: true,
                message: e.message,
                value: e,
            };
        }

        return {
            hasMessage: hasMessage,
            isError: false,
            message: hasMessage ? e.message : String(e),
            value: e,
        };
    }


    /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/print.ts#L64 */
    function printCloseTo(receivedDiff, expectedDiff, precision, isNot) {
        var receivedDiffString = stringify(receivedDiff);
        var expectedDiffString = stringIncludes(receivedDiffString, 'e')
            ? expectedDiff.toExponential(0)
            : 0 <= precision && precision <= 20
                ? expectedDiff.toFixed(precision + 1)
                : stringify(expectedDiff);

        return (
            'Expected precision: ' + stringify(precision) + SINGLE_NEWLINE +
            'Expected difference: ' + (isNot ? 'not ' : '') + '< ' + expectedDiffString + SINGLE_NEWLINE +
            'Received difference: ' + receivedDiffString
        );
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/print.ts#L126 */
    function printConstructorName(label, constructor, isNot, isExpected) {
        return (
            typeof constructor.name !== 'string'
                ? label + ' name is not a string'
                : constructor.name.length === 0
                    ? label + ' name is an empty string'
                    : label + ': ' + (!isNot ? '' : isExpected ? 'not ' : ' ') + constructor.name
        );
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/jest-matcher-utils/src/index.ts#L121 */
    function printWithType(name, value, printerFunc) {
        var type = getType(value);
        var hasType = type !== 'null' && type !== 'undefined'
            ? name + ' has type: ' + type + SINGLE_NEWLINE
            : '';
        return hasType + name + ' has value: ' + (typeof printerFunc === 'function' ? printerFunc(value) : stringify(value));
    }

    /** https://github.com/facebook/jest/blob/068ec04cc025596f01f79a0c472d9cc6553a72ca/packages/jest-matcher-utils/src/index.ts#L484 */
    function getLabelPrinter () {
        var maxLength = 0;
        for (var i = 0; i < arguments.length; i++) {
            var length = arguments[i].length;
            maxLength = length > maxLength ? length : maxLength;
        }
        return function(string) {
            return string + ': ' + ' '.repeat(maxLength - string.length);
        };
    }


    // The serialized array is compatible with pretty-format package min option.
    // However, items have default stringify depth (instead of depth - 1)
    // so expected item looks consistent by itself and enclosed in the array.
    /** https://github.com/facebook/jest/blob/068ec04cc025596f01f79a0c472d9cc6553a72ca/packages/expect/src/print.ts#L49 */
    function printReceivedArrayContainExpectedItem (received, index) {
        return (
            '[' +
            received
                .map(function(item, i) {
                    var stringified = stringify(item);
                    return i === index ? INVERTED_COLOR(stringified) : stringified;
                })
                .join(', ') +
            ']'
        );
    }


    // /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/jest-matcher-utils/src/index.ts#L116 */
    // function printValue (value) {
    //     // TODO
    // }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/jest-matcher-utils/src/index.ts#L418 */
    function matcherErrorMessage (hint, generic, specific) {
        return (
            hint +
                DOUBLE_NEWLINE +
                'Matcher error: ' + generic +
                (typeof specific === 'string' ? DOUBLE_NEWLINE + specific : '')
        );
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/jest-matcher-utils/src/index.ts#L158 */
    function ensureValueIsNumber(label, value, matcherName, options) {
        var type = getType(value);

        if (type !== 'number' && type !== 'bigint') {
            throw new Error(
                matcherErrorMessage(
                    matcherHint(matcherName, undefined, undefined, options),
                    label.toLowerCase() + ' value must be a number or bigint',
                    label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() + ': ' + value
                )
            );
        }
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/jest-matcher-utils/src/index.ts#L135 */
    function ensureNoExpected(expected, matcherName, options) {
        if (typeof expected !== 'undefined') {
            throw new Error(
                matcherErrorMessage(
                    matcherHint(matcherName, undefined, '', options),
                    'this matcher must not have an expected argument',
                    printWithType('Expected', expected)
                )
            );
        }
    }


    /** https://github.com/facebook/jest/blob/0fd5e3cdd80a866623f1f0cf2385fef38015d51f/packages/expect/src/utils.ts#L51 */
    function getPath(object, propertyPath) {
        object = twx_Sanitize(object);

        if (!Array.isArray(propertyPath)) {
            propertyPath = propertyPath.split('.');
        }

        if (propertyPath.length) {
            var lastProp = propertyPath.length === 1;
            var prop = propertyPath[0];
            var newObject = object[prop];

            if (!lastProp && (newObject === null || newObject === undefined)) {
                /**
                 * This is not the last prop in the chain. If we keep recursing it will
                 * hit a `can't access property X of undefined | null`. At this point we
                 * know that the chain has broken and we can return right away.
                 */
                return {
                    hasEndProp: false,
                    lastTraversedObject: object,
                    traversedPath: []
                };
            }

            var res = getPath(newObject, propertyPath.slice(1));

            if (res.lastTraversedObject === null) {
                res.lastTraversedObject = object;
            }

            res.traversedPath.unshift(prop);

            if (lastProp) {
                /**
                 * Does object have the property with an undefined value?
                 * Although primitive values support bracket notation (above)
                 * they would throw TypeError for in operator (below).
                 */
                res.hasEndProp = newObject !== undefined || (!isPrimitive(object) && prop in object);

                if (!res.hasEndProp) {
                    res.traversedPath.shift();
                }
            }

            return res;
        }

        return {
            lastTraversedObject: null,
            traversedPath: [],
            value: object
        };
    }


    /** https://github.com/facebook/jest/blob/0fd5e3cdd80a866623f1f0cf2385fef38015d51f/packages/expect/src/index.ts#L139 */
    function getMessage(message/*?: () => string*/) {
        return (message && message()) || 'No message was specified for this matcher.';
    }


    /** https://github.com/facebook/jest/blob/0fd5e3cdd80a866623f1f0cf2385fef38015d51f/packages/expect/src/index.ts#L357 */
    function _validateResult(result/*: any*/) {
        if (
            typeof result !== 'object' ||
            typeof result.pass !== 'boolean' ||
            (result.message &&
                (typeof result.message !== 'string' &&
                    typeof result.message !== 'function'))
        ) {
            throw new Error(
                'Unexpected return from a matcher function.' + SINGLE_NEWLINE +
                'Matcher functions should ' +
                'return an object in the following format:' + SINGLE_NEWLINE +
                '  {message?: string | function, pass: boolean}' + SINGLE_NEWLINE +
                '\'' + stringify(result) + '\' was returned'
            );
        }
    }

    /** https://github.com/facebook/jest/blob/0fd5e3cdd80a866623f1f0cf2385fef38015d51f/packages/expect/src/index.ts#L233 */
    function makeThrowingMatcher(
        matcherName/*: string*/,
        matcher/*: RawMatcherFn*/,
        isNot/*: boolean*/,
        // promise/*: string*/,
        actual/*: any*/,
        err/*?: AssertionError*/
    ) {
        return function throwingMatcher(/*...args*/)/*: any*/ {
            var args = arguments;
            var throws = true;
            // var utils = { ...matcherUtils, iterableEquality, subsetEquality };

            var matcherContext/*: MatcherState*/ = {
                // When throws is disabled, the matcher will not throw errors during test
                // execution but instead add them to the global matcher state. If a
                // matcher throws, test execution is normally stopped immediately. The
                // snapshot matcher uses it because we want to log all snapshot
                // failures in a test.
                // dontThrow: () => (throws = false),
                dontThrow: function () {
                    throws = false;
                },
                // ...getState(),
                equals: equals,
                // error: err,
                isNot: isNot,
                // promise,
                // utils,
                name: matcherName
            };

            function processResult(
                result/*: SyncExpectationResult*/
                // asyncError/*?: AssertionError*/,
            ) {
                _validateResult(result);

                //                getState().assertionCalls++;

                if ((result.pass && isNot) || (!result.pass && !isNot)) {
                    // XOR
                    var message = getMessage(result.message);
                    var error;

                    if (err) {
                        error = err;
                        error.message = message;
                    }
                    // else if (asyncError) {
                    //     error = asyncError;
                    //     error.message = message;
                    // }
                    else {
                        // error = new AssertionError(message);
                        error = new Error(message);

                        // Try to remove this function from the stack trace frame.
                        // Guard for some environments (browsers) that do not support this feature.
                        if (Error.captureStackTrace) {
                            Error.captureStackTrace(error, throwingMatcher);
                        }
                    }
                    // Passing the result of the matcher with the error so that a custom
                    // reporter could access the actual and expected objects of the result
                    // for example in order to display a custom visual diff
                    error.matcherResult = result;

                    if (throws) {
                        throw error;
                    } else {
                        //                        getState().suppressedErrors.push(error);
                    }
                }
            }

            function handlError(error/*: Error*/) {
                if (
                    // matcher[INTERNAL_MATCHER_FLAG] === true &&
                    !(error instanceof Error) &&
                    // !(error instanceof AssertionError) &&
                    // error.name !== 'PrettyFormatPluginError' &&
                    // Guard for some environments (browsers) that do not support this feature.
                    Error.captureStackTrace
                ) {
                    // Try to remove this and deeper functions from the stack trace frame.
                    Error.captureStackTrace(error, throwingMatcher);
                }
                throw error;
            }

            var potentialResult/*: ExpectationResult*/;

            try {
                var expected = args[0];
                var restOfArgs = Array.prototype.slice.call(args, 1);
                potentialResult = matcher(matcherContext, actual, expected, /*...*/restOfArgs);

                var syncResult = potentialResult/* as SyncExpectationResult*/;

                return processResult(syncResult);

                // if (isPromise(potentialResult)) {
                //     var asyncResult = potentialResult/* as AsyncExpectationResult*/;
                //     var asyncError = new AssertionError();
                //     if (Error.captureStackTrace) {
                //         Error.captureStackTrace(asyncError, throwingMatcher);
                //     }

                //     return asyncResult
                //         .then(aResult => processResult(aResult, asyncError))
                //         .catch(error => handlError(error));
                // } else {
                //     var syncResult = potentialResult/* as SyncExpectationResult*/;

                //     return processResult(syncResult);
                // }
            } catch (error) {
                return handlError(error);
            }
        };
    }



    /*********************************
     * Matchers
     ********************************/

    var ALL_MATCHERS = {
        /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/matchers.ts#L72 */
        toBe: function (state, received, expected) {
            var options = {
                comment: 'Object.is equality',
                isNot: state.isNot,
                promise: state.promise
            };
            var pass = Object_is(received, expected);

            return MatcherResult(pass, function () {
                if (pass) {
                    return (
                        matcherHint(state.name, received, expected, options) +
                        DOUBLE_NEWLINE +
                        'Expected: not ' + stringify(expected)
                    );
                } else {
                    var expectedType = getType(expected);
                    var deepEqualityName = null;
                    if (expectedType !== 'map' && expectedType !== 'set') {
                        // If deep equality passes when referential identity fails,
                        // but exclude map and set until review of their equality logic.
                        if (equals(received, expected, toStrictEqualTesters, true)) {
                            deepEqualityName = 'toStrictEqual';
                        } else if (equals(received, expected, [iterableEquality])) {
                            deepEqualityName = 'toEqual';
                        }
                    }

                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        (deepEqualityName ?
                            'If it should pass with deep equality, replace ' + state.name + ' with ' + deepEqualityName + DOUBLE_NEWLINE
                            : ''
                        ) +
                        'Expected: ' + expected + SINGLE_NEWLINE +
                        'Received: ' + received + SINGLE_NEWLINE
                    );
                }
            });
        },

        /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/matchers.ts#L125 */
        toBeCloseTo: function (state, received, expected, args) {
            var secondArgument = args.length === 1 ? 'precision' : undefined;
            var isNot = state.isNot;
            var options = {
                isNote: isNot,
                promise: state.promise,
                secondArgument: secondArgument
            };

            ensureValueIsNumber('received', received, state.name, options);
            ensureValueIsNumber('expected', expected, state.name, options);

            var precision = 2;
            if (args.length > 0) {
                precision = args[0];
            }

            var expectedDiff = Math.pow(10, -precision) / 2;
            var receivedDiff = Math.abs(expected - received);
            var pass = receivedDiff < expectedDiff;

            return MatcherResult(pass, function () {
                if (pass) {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected: not ' + expected +
                        (receivedDiff === 0 ? '' : 'Received: ' + received + DOUBLE_NEWLINE) +
                        printCloseTo(receivedDiff, expectedDiff, precision, isNot)
                    );
                } else {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected: ' + expected + SINGLE_NEWLINE +
                        'Received: ' + received + DOUBLE_NEWLINE +
                        printCloseTo(receivedDiff, expectedDiff, precision, isNot)
                    );
                }
            });
        },

        /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/matchers.ts#L196 */
        toBeDefined: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            ensureNoExpected(expected, state.name, options);

            var pass = received !== void 0;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Received: ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/matchers.ts#L214 */
        toBeFalsy: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            ensureNoExpected(expected, state.name, options);

            var pass = !received;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Received: ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/matchers.ts#L232 */
        toBeGreaterThan: function (state, received, expected) {
            var isNot = state.isNot;
            var options = {
                isNot: isNot,
                promise: state.isNot
            };

            ensureValueIsNumber('received', received, state.name, options);
            ensureValueIsNumber('expected', expected, state.name, options);

            var pass = received > expected;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected:' + (isNot ? ' not' : '') + ' > ' + expected + SINGLE_NEWLINE +
                    'Received:' + (isNot ? '    ' : '') + '   ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/e3f4c65140f08a2ec81e5a8260704c1d201e33c1/packages/expect/src/matchers.ts#L256 */
        toBeGreaterThanOrEqual: function (state, received, expected) {
            var isNot = state.isNot;
            var options = {
                isNot: isNot,
                promise: state.promise
            };

            ensureValueIsNumber('received', received, state.name, options);
            ensureValueIsNumber('expected', expected, state.name, options);

            var pass = received >= expected;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected:' + (isNot ? ' not' : '') + ' >= ' + expected + SINGLE_NEWLINE +
                    'Received:' + (isNot ? '    ' : '') + '    ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L280 */
        toBeInstanceOf: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            if (typeof expected !== 'function') {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'expected value must be a function',
                        'Expected: ' + expected
                    )
                );
            }

            var pass = received instanceof expected;

            return MatcherResult(pass, function () {
                if (pass) {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                            DOUBLE_NEWLINE +
                            printConstructorName('Expected constructor', expected, true, true) +
                            DOUBLE_NEWLINE +
                            received.constructor !== expected
                            ? printConstructorName('Received constructor', received.constructor, true, true)
                            : ''
                    );
                } else {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        printConstructorName('Expected constructor', expected, false, true) +
                        DOUBLE_NEWLINE +
                        (isPrimitive(received) || Object.getPrototypeOf(received) === null
                            ? 'Received value has no prototype' + DOUBLE_NEWLINE + 'Received value: ' + received
                            : typeof received.constructor !== 'function'
                                ? 'Received value: ' + received
                                : printConstructorName('Received constructor', received.constructor, false, false))
                    );
                }
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L331 */
        toBeLessThan: function (state, received, expected) {
            var isNot = state.isNot;
            var options = {
                isNot: isNot,
                promise: state.promise
            };

            ensureValueIsNumber('received', received, state.name, options);
            ensureValueIsNumber('expected', expected, state.name, options);

            var pass = received < expected;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected: ' + (isNot ? 'not' : ' ') + ' < ' + expected +
                    DOUBLE_NEWLINE +
                    'Received: ' + (isNot ? 'not' : ' ') + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L355 */
        toBeLessThanOrEqual: function (state, received, expected) {
            var isNot = state.isNot;
            var options = {
                isNot: isNot,
                promise: state.promise
            };

            ensureValueIsNumber('received', received, state.name, options);
            ensureValueIsNumber('expected', expected, state.name, options);

            var pass = received <= expected;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected: ' + (isNot ? 'not' : ' ') + ' <= ' + expected +
                    DOUBLE_NEWLINE +
                    'Received: ' + (isNot ? 'not' : ' ') + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L379 */
        toBeNaN: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            ensureNoExpected(expected, state.name, options);

            var pass = Number_isNaN(received);

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Received: ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L397 */
        toBeNull: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            ensureNoExpected(expected, state.name, options);

            var pass = received === null;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Received: ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L415 */
        toBeTruthy: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            ensureNoExpected(expected, state.name, options);

            var pass = !!received;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Received: ' + received
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L433 */
        toBeUndefined: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            ensureNoExpected(expected, state.name, options);

            var pass = received === void 0;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Received: ' + received
                );
            });
        },

        // /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L451 */
        // toContain: function (state, received, expected) {
        //     // TODO
        // },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L538 */
        toContainEqual: function (state, received, expected) {
            var isNot = state.isNot;
            var options = {
                comment: 'deep equality',
                isNot: isNot,
                promise: state.promise,
            };

            if (received == null) {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'received value must not be null nor undefined',
                        printWithType('Received', received, printReceived),
                    )
                );
            }

            var receivedInfoTable = twx_IsInfoTable(received);

            received = twx_Sanitize(received);

            if (receivedInfoTable) {
                received = received.rows;
            }

            var index = Array.from(received).findIndex(function (item) {
                return equals(item, expected, [iterableEquality]);
            });
            var pass = index !== -1;

            return MatcherResult(pass, function () {
                var labelExpected = 'Expected value';
                var labelReceived = 'Received ' + getType(received);
                var printLabel = getLabelPrinter(labelExpected, labelReceived);

                return (
                    matcherHint(state.name, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    printLabel(labelExpected) + (isNot ? 'not ' : '') + printExpected(expected) + SINGLE_NEWLINE +
                    printLabel(labelReceived) + (isNot ? '    ' : '') + (
                        isNot && Array.isArray(received)
                            ? printReceivedArrayContainExpectedItem(received, index)
                            : printReceived(received)
                    )
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L588 */
        toEqual: function (state, received, expected) {
            var options = {
                comment: 'deep equality',
                isNot: state.isNot,
                promise: state.promise
            };

            var pass = equals(received, expected, [iterableEquality], false);

            return MatcherResult(pass, function () {
                var receivedStr = stringify(received);
                var expectedStr = stringify(expected);

                if (pass) {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected: not ' + expectedStr +
                        (expectedStr !== receivedStr ? DOUBLE_NEWLINE + 'Received: ' + receivedStr : '')
                    );
                } else {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Received: ' + receivedStr +
                        DOUBLE_NEWLINE +
                        'Expected: ' + expectedStr
                    );

                }
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L623 */
        toHaveLength: function (state, received, expected) {
            var isNot = state.isNot;
            var options = {
                isNot: isNot,
                promise: state.promise
            };

            var receivedInfoTable = twx_IsInfoTable(received);

            var receivedLength;
            if (receivedInfoTable) {
                receivedLength = received.rows.length;
            } else if (received) {
                receivedLength = received.length;
            }

            if (typeof received !== 'string' && (!received || typeof receivedLength !== 'number')) {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'received value must have a length property whose value must be a number',
                        printWithType('Received', received)
                    )
                );
            }

            /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/jest-matcher-utils/src/index.ts#L210 */
            /** ensureExpectedIsNonNegativeInteger() */
            if (typeof expected !== 'number' || !Number_isSafeInteger(expected) || expected < 0) {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'expected value must be a non-negative integer',
                        printWithType('Expected', expected)
                    )
                );
            }

            var pass = receivedLength === expected;

            return MatcherResult(pass, function () {
                return (
                    matcherHint(state.name, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected length ' + (isNot ? 'not ' : '') + expected +
                    DOUBLE_NEWLINE +
                    (isNot
                        ? ''
                        : 'Received length ' + receivedLength) +
                    DOUBLE_NEWLINE +
                    'Received ' + getType(received) + ': ' + stringify(received)
                );
            });
        },

        /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/matchers.ts#L680 */
        toHaveProperty: function (state, received, expectedPath, args) {
            var expectedArgument = 'path';

            var hasValue = args.length === 1;

            var options = {
                isNot: state.isNot,
                promise: state.promise,
                secondArgument: hasValue ? 'value' : ''
            };

            if (received === null || received === undefined) {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, expectedArgument, options),
                        'received value must not be null or undefined',
                        printWithType('Received', received)
                    )
                );
            }

            var expectedPathType = getType(expectedPath);

            if (expectedPathType !== 'string' && expectedPathType !== 'array') {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, expectedArgument, options),
                        'expected path must be a string or array',
                        printWithType('Expected', expectedPath)
                    )
                );
            }

            var expectedPathLength = expectedPathType === 'string'
                ? expectedPath.split('.').length
                : expectedPath.length;

            if (expectedPathType === 'array' && expectedPathLength === 0) {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, expectedArgument, options),
                        'expected path must not be an empty array',
                        printWithType('Expected', expectedPath)
                    )
                );
            }

            var res = getPath(received, expectedPath);

            var lastTraversedObject = res.lastTraversedObject;
            var hasEndProp = res.hasEndProp;
            var receivedPath = res.traversedPath;
            var hasCompletePath = receivedPath.length === expectedPathLength;
            var receivedValue = hasCompletePath ? res.value : lastTraversedObject;

            var pass = hasValue ? equals(res.value, expectedValue) : !!hasEndProp;

            /** 
             * Delete this unique report if future breaking change
             * removes the edge case that expected value undefined
             * also matches absence of a property with the key path.
             */
            if (pass && !hasCompletePath) {
                return MatcherResult(pass, function () {
                    return (
                        matcherHint(state.name, undefined, expectedArgument, options) +
                        DOUBLE_NEWLINE +
                        'Expected path: ' + expectedPath +
                        SINGLE_NEWLINE +
                        'Received path: ' + (expectedPathType === 'array' || receivedPath.length === 0
                            ? receivedPath
                            : receivedPath.join('.')) +
                        DOUBLE_NEWLINE +
                        'Expected value: not ' + expectedValue +
                        SINGLE_NEWLINE +
                        'Received value: ' + receivedValue +
                        DOUBLE_NEWLINE +
                        'Because a positive assertion passes for expected value undefined ' +
                        'if the property does not exist, this negative assertion fails ' +
                        'unless the property does exist and has a defined value'
                    );
                });
            }

            return MatcherResult(pass, function () {
                if (pass) {
                    return (
                        matcherHint(state.name, undefined, expectedArgument, options) +
                        DOUBLE_NEWLINE +
                        (hasValue ?
                            'Expected path: ' + expectedPath + DOUBLE_NEWLINE +
                            'Expected value: not ' + expectedValue +
                            (stringify(expectedValue) !== stringify(receivedValue) ?
                                SINGLE_NEWLINE + 'Received value: ' + receivedValue : '') :
                            'Expected path: not' + expectedPath + DOUBLE_NEWLINE +
                            'Received value: ' + receivedValue)
                    );
                } else {
                    return (
                        matcherHint(state.name, undefined, expectedArgument, options) +
                        DOUBLE_NEWLINE +
                        'Expected path: ' + expectedPath + SINGLE_NEWLINE +
                        (hasCompletePath ?
                            'Expected value: ' + expectedValue + DOUBLE_NEWLINE + 'Received value: ' + receivedValue :
                            'Received path: ' +
                            (expectedPathType === 'array' || receivedPath.length === 0 ? receivedPath : receivedPath.join('.')) +
                            DOUBLE_NEWLINE +
                            (hasValue ? 'Expected value: ' + expectedValue + SINGLE_NEWLINE : '') +
                            'Received value: ' + receivedValue)
                    );
                }
            });
        },

        /** https://github.com/facebook/jest/blob/0fd5e3cdd80a866623f1f0cf2385fef38015d51f/packages/expect/src/matchers.ts#L803 */
        toMatch: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            if (typeof received !== 'string') {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'received value must be a string',
                        printWithType('Received', received)
                    )
                );
            }

            if (!(typeof expected === 'string') && !(expected && typeof expected.test === 'function')) {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'expected value must be a string or regular expression',
                        printWithType('Expected', expected)
                    )
                );
            }

            var pass = typeof expected === 'string'
                ? stringIncludes(received, expected)
                : expected.test(received);

            return MatcherResult(pass, function () {
                var labelExpected = 'Expected ' + (typeof expected === 'string' ? 'substring' : 'pattern');

                if (pass) {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected ' + labelExpected + ': not ' + expected + SINGLE_NEWLINE +
                        'Received string: ' + received
                    );
                } else {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected ' + labelExpected + ': ' + expected + SINGLE_NEWLINE +
                        'Received string: ' + received
                    );
                }
            });
        },

        /** https://github.com/facebook/jest/blob/b5c7092687a265e3f4f2ba6f9787e47e8c6b9d5e/packages/expect/src/matchers.ts#L929 */
        toStrictEqual: function(state, received, expected) {
            var options = {
                comment: 'deep equality',
                isNot: state.isNot,
                promise: state.promise
            };

            var pass = equals(received, expected, toStrictEqualTesters, true);

            return MatcherResult(pass, function () {
                var receivedStr = stringify(received);
                var expectedStr = stringify(expected);

                if (pass) {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected: not ' + expectedStr +
                        (expectedStr !== receivedStr ? DOUBLE_NEWLINE + 'Received: ' + receivedStr : '')
                    );
                } else {
                    return (
                        matcherHint(state.name, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Received: ' + receivedStr +
                        DOUBLE_NEWLINE +
                        'Expected: ' + expectedStr
                    );

                }
            });
        },
    };


    // function package(func) {
    //     var pkg = {};

    //     function register(fn) {
    //         if (typeof fn === 'function') {
    //             pkg[fn.name] = fn
    //         }
    //         return fn;
    //     }

    //     func(register);

    //     return pkg;
    // }

    

    /**
     * Printers
     */

    function INVERTED_COLOR(val) {
        return '‹‹' + val + '››';
    }

    /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/expect/src/print.ts#L19 */
    function printSubstring(val) {
        return val.replace(/"|\\/g, '\\$&');
    }

    /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/expect/src/print.ts#L21 */
    function printReceivedStringContainExpectedSubstring(received, start, length) {
        return (
            '"' +
            printSubstring(received.slice(0, start)) +
            INVERTED_COLOR(printSubstring(received.slice(start, start + length))) +
            printSubstring(received.slice(start + length)) +
            '"'
        );
    }

    /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/expect/src/print.ts#L34 */
    function printReceivedStringContainExpectedResult(received, result) {
        return (
            result === null
                ? printReceived(received)
                : printReceivedStringContainExpectedSubstring(
                    received,
                    result.index,
                    result[0].index
                )

        );
    }


    function printReceived(obj) {
        return stringify(obj);
        // return replaceTrailingSpaces(stringify(obj));
    }

    function printExpected(obj) {
        return stringify(obj);
        // return replaceTrailingSpaces(stringify(obj));
    }


    /**
     * Throwers
     */

    /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/expect/src/toThrowMatchers.ts#L370 */
    function formatExpectedThrown(label, expected) {
        return label + printExpected(expected) + SINGLE_NEWLINE;
    }

    /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/expect/src/toThrowMatchers.ts#L373 */
    function formatReceivedThrown(label, thrown, key, expected) {
        if (thrown === null) {
            return '';
        }

        if (key === 'message') {
            var message = thrown.message;

            if (typeof expected === 'string') {
                var index = message.indexOf(expected);
                if (index !== -1) {
                    return (
                        label +
                        printReceivedStringContainExpectedSubstring(
                            message,
                            index,
                            expected.length,
                        ) +
                        SINGLE_NEWLINE
                    );
                }
            } else if (expected instanceof RegExp) {
                return (
                    label +
                    printReceivedStringContainExpectedResult(
                        message,
                        typeof expected.exec === 'function' ? expected.exec(message) : null,
                    ) +
                    SINGLE_NEWLINE
                );
            }

            return label + printReceived(message) + SINGLE_NEWLINE;
        }

        if (key === 'name') {
            return thrown.isError
                ? label + printReceived(thrown.value.name) + SINGLE_NEWLINE
                : '';
        }

        if (key === 'value') {
            return thrown.isError ? '' : label + printReceived(thrown.value) + SINGLE_NEWLINE;
        }

        return '';
    }


    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/toThrowMatchers.ts#L340 */
    function toThrowExpectedNotDefined(matcherName, options, thrown) {
        var pass = thrown !== null;

        return MatcherResult(pass, function () {
            if (pass) {
                return (
                    matcherHint(matcherName, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    'Error Name: ' + thrown.name + ', Error Message: ' + thrown.message
                );
            } else {
                return (
                    matcherHint(matcherName, undefined, '', options) +
                    DOUBLE_NEWLINE +
                    DID_NOT_THROW
                );
            }
        });
    }

    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/toThrowMatchers.ts#L305 */
    function toThrowExpectedStringResult(matcherName, options, thrown, expected) {
        var pass = thrown !== null && stringIncludes(thrown.message, expected);

        return MatcherResult(pass, function () {
            if (pass) {
                return (
                    matcherHint(matcherName, undefined, undefined, options) +
                        DOUBLE_NEWLINE +
                        'Expected substring: not ' + expected +
                        DOUBLE_NEWLINE +
                        !!thrown.message ?
                        'Received message: ' + thrown.message :
                        'Received value: ' + thrown.value || thrown
                );
            } else {
                return (
                    matcherHint(matcherName, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected substring: ' + expected +
                    DOUBLE_NEWLINE +
                    (thrown === null
                        ? DID_NOT_THROW :
                        thrown.message ?
                            'Received message: ' + thrown.message :
                            'Received value:' + thrown.value || thrown)
                );
                // return (
                //     matcherHint(matcherName, undefined, undefined, options) +
                //     DOUBLE_NEWLINE +
                //     'Expected substring: ' + expected +
                //     (thrown === null
                //         ? DOUBLE_NEWLINE + DID_NOT_THROW :
                //         thrown.message ?
                //             'Received message: ' + thrown.message :
                //             'Received value:' + thrown.value || thrown)
                // );
            }
        });
    }

    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/toThrowMatchers.ts#L142 */
    function toThrowExpectedRegExp(matcherName, options, thrown, expected) {
        var pass = thrown !== null && expected.test(thrown.message);

        return MatcherResult(pass, function () {
            if (pass) {
                return (
                    matcherHint(matcherName, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected pattern: not ' + expected +
                    DOUBLE_NEWLINE +
                    (!!thrown.message
                        ? 'Received message: ' + thrown.message
                        : 'Received value: ' + thrown.value || thrown)
                );
            } else {
                return (
                    matcherHint(matcherName, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected pattern: ' + expected +
                    (thrown === null ?
                        DOUBLE_NEWLINE + DID_NOT_THROW :
                        !!thrown.message ?
                            'Received message: ' + thrown.message :
                            'Received value:' + thrown.value || thrown)
                );
            }
        });
    }

    /** https://github.com/facebook/jest/blob/2f793b8836e7f900887e6a403f1ba9b3005fac25/packages/expect/src/toThrowMatchers.ts#L216 */
    function toThrowExpectedObject(matcherName, options, thrown, expected) {
        var pass = thrown !== null && thrown.message === expected.message;

        return MatcherResult(pass, function () {
            if (pass) {
                return (
                    matcherHint(matcherName, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    'Expected message: not ' + expected.message +
                    (thrown !== null && thrown.hasMessage ?
                        'Received message: ' + thrown.message :
                        'Received value: ' + thrown.value || thrown)
                );
            } else {
                return (
                    matcherHint(matcherName, undefined, undefined, options) +
                    DOUBLE_NEWLINE +
                    (thrown === null
                        ? formatExpectedThrown('Expected message: ', expected.message) + SINGLE_NEWLINE + DID_NOT_THROW
                        : thrown.hasMessage
                            // ? 'Received message: ' + thrown.message
                            ? formatExpectedThrown('Expected message: ', expected.message) +
                              formatReceivedThrown('Received message: ', thrown, 'message')
                            : formatExpectedThrown('Expected message: ', expected.message) +
                              formatReceivedThrown('Received value:   ', thrown, 'value')
                    )
                );
            }
        });
    }


    var THROWING_MATCHERS = {
        /** https://github.com/facebook/jest/blob/438118a8024cd76852affa7198936111df2f7cc0/packages/expect/src/toThrowMatchers.ts#L74 */
        toThrow: function (state, received, expected) {
            var options = {
                isNot: state.isNot,
                promise: state.promise
            };

            if (typeof received !== 'function') {
                var placeholder = expected === undefined ? '' : 'expected';
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, placeholder, options),
                        'received value must be a function',
                        'Received: ' + received
                    )
                );
            }

            var thrown = null;
            try {
                received();
            } catch (err) {
                thrown = getThrown(err);
            }

            if (expected === undefined) {
                return toThrowExpectedNotDefined(state.name, options, thrown);
            } else if (typeof expected === 'string') {
                return toThrowExpectedStringResult(state.name, options, thrown, expected);
            } else if (expected !== null && typeof expected.test === 'function') {
                return toThrowExpectedRegExp(state.name, options, thrown, expected);
            } else if (expected !== null && typeof expected === 'object') {
                return toThrowExpectedObject(state.name, options, thrown, expected);
            } else {
                throw new Error(
                    matcherErrorMessage(
                        matcherHint(state.name, undefined, undefined, options),
                        'expected value must be undefined, a string, a regular expression, or an error',
                        'Expected: ' + expected
                    )
                );
            }
        }
    };


    /*********************************
     * Unit Test Functions
     ********************************/

    function expect(actual) {
        actual = twx_Sanitize(actual);

        var matcherName;
        var matcher;

        var expectation = {
            not: {},
            //            rejects: { not: {} },
            //            resolves: { not: {} },
        };

        for (matcherName in ALL_MATCHERS) {
            matcher = ALL_MATCHERS[matcherName];
            // var promiseMatcher = getPromiseMatcher(name, matcher) || matcher;
            expectation[matcherName] = makeThrowingMatcher(matcherName, matcher, false,/* '',*/ actual);
            expectation.not[matcherName] = makeThrowingMatcher(matcherName, matcher, true,/* '',*/ actual);

            // expectation.resolves[matcherName] = makeResolveMatcher(
            //     name: matcherName,
            //     promiseMatcher,
            //     false,
            //     actual,
            //     err,
            // );
            // expectation.resolves.not[matcherName] = makeResolveMatcher(
            //     name: matcherName,
            //     promiseMatcher,
            //     true,
            //     actual,
            //     err,
            // );

            // expectation.rejects[matcherName] = makeRejectMatcher(
            //     name: matcherName,
            //     promiseMatcher,
            //     false,
            //     actual,
            //     err,
            // );
            // expectation.rejects.not[matcherName] = makeRejectMatcher(
            //     name: matcherName,
            //     promiseMatcher,
            //     true,
            //     actual,
            //     err,
            // );
        }

        for (matcherName in THROWING_MATCHERS) {
            matcher = THROWING_MATCHERS[matcherName];
            expectation[matcherName] = makeThrowingMatcher(matcherName, matcher, false, actual);
        }

        return expectation;
    }

    var describeDescription = '';
    var describeEntityName = '';
    var describeServiceName = '';

    /** https://github.com/facebook/jest/blob/438118a8024cd76852affa7198936111df2f7cc0/packages/jest-jasmine2/src/jasmine/Env.ts#L368 */
    function describe(description, specDefinitions) {
        if (specDefinitions === undefined) {
            throw new Error(
                'Missing second argument. It must be a callback function.'
            );
        }
        if (typeof specDefinitions !== 'function') {
            throw new Error(
                'Invalid second argument, ' + specDefinitions + '. It must be a callback function.'
            );
        }
        // if (specDefinitions.length > 0) {
        //     throw new Error('describe callback function does not expect any arguments');
        // }

        var ctx = {};

        describeEntityName = '';
        describeServiceName = '';

        if (twx_IsService(description)) {
            ctx.service = description;
            var serviceInfo = twx_GetServiceInfo(description);
            if (serviceInfo) {
                if (serviceInfo.entityName && serviceInfo.serviceName) {
                    describeEntityName = serviceInfo.entityName;
                    describeServiceName = serviceInfo.serviceName;
                    description = serviceInfo.entityName + '.' + serviceInfo.serviceName + '()';
                }
            }
        }

        describeDescription = description;

        try {
            specDefinitions(ctx);
        } catch (err) {
            throw new Error(description + ' › ' + err.message);
        }
    }

    /** https://github.com/facebook/jest/blob/438118a8024cd76852affa7198936111df2f7cc0/packages/jest-jasmine2/src/jasmine/Env.ts#L539 */
    function test(description, fn) {
        if (typeof description !== 'string') {
            throw new Error(
                'Invalid first argument, ' + description + '. It must be a string.'
            );
        }
        if (fn === undefined) {
            throw new Error(
                'Missing second argument. It must be a callback function. Perhaps you want to use `test.todo` for a test placeholder.'
            );
        }
        if (typeof fn !== 'function') {
            throw new Error(
                'Invalid second argument, ' + fn + '. It must be a callback function.'
            );
        }
        
        var error;
        var start = Date.now();

        try {
            fn();
        } catch (err) {
            error = err;
        }

        var end = Date.now();

        unitTestResult.rows.push({
            id: '' + unitTestResult.rows.length,
            description: describeDescription,
            test: description,
            entityName: describeEntityName,
            serviceName: describeServiceName,
            duration: end - start,
            pass: error === undefined,
            error: error ? error.message : ''
        });

        // try {
        //     fn();
        // } catch (err) {
        //     throw new Error(description + ': ' + err.message);
        // }
    }


    exports.expect = expect;
    exports.describe = describe;
    exports.test = test;
    exports.result = unitTestResult;
}).toString();