// /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/jest-matcher-utils/src/index.ts#L115 */
    // function replaceTrailingSpaces(text) {
    //     return text.replace(/\s+$/gm, function(spaces) {
    //         var SPACE_SYMBOL = '\u{00B7}'; // middle dot
    //         return SPACE_SYMBOL.repeat(spaces.length);
    //     });
    // }

    // /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/jest-matcher-utils/src/index.ts#L484 */
    // function getLabelPrinter() {
    //     var strings = arguments;
    //     var maxLength = strings.reduce(function(max, string) {
    //         return string.length > max ? string.length : max;
    //     }, 0);
    //     return function(str) {
    //         return str + ': ' + ' '.repeat(maxLength - string.length);
    //     }
    // }


    // // Given array of diffs, return concatenated string:
    // // * include common substrings
    // // * exclude change substrings which have opposite op
    // // * include change substrings which have argument op
    // //   with inverse highlight only if there is a common substring
    // /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/jest-matcher-utils/src/index.ts#L239 */
    // function getCommonAndChangedSubstrings(
    //     diffs,
    //     op,
    //     hasCommonDiff,
    // ) {
    //     return diffs.reduce(
    //         (reduced, diff) =>
    //             reduced +
    //             (diff[0] === DIFF_EQUAL
    //                 ? diff[1]
    //                 : diff[0] !== op
    //                     ? ''
    //                     : hasCommonDiff
    //                         ? INVERTED_COLOR(diff[1])
    //                         : diff[1]),
    //         '',
    //     );
    // }


    // /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/jest-matcher-utils/src/index.ts#L257 */
    // function isLineDiffable(expected, received) {
    //     var MULTILINE_REGEXP = /\n/;
    //     var expectedType = getType(expected);
    //     var receivedType = getType(received);

    //     if (expectedType !== receivedType) {
    //         return false;
    //     }

    //     if (getType.isPrimitive(expected)) {
    //         // Print generic line diff for strings only:
    //         // * if neither string is empty
    //         // * if either string has more than one line
    //         return (
    //             typeof expected === 'string' &&
    //             typeof received === 'string' &&
    //             expected.length !== 0 &&
    //             received.length !== 0 &&
    //             (MULTILINE_REGEXP.test(expected) || MULTILINE_REGEXP.test(received))
    //         );
    //     }

    //     if (
    //         expectedType === 'date' ||
    //         expectedType === 'function' ||
    //         expectedType === 'regexp'
    //     ) {
    //         return false;
    //     }

    //     if (expected instanceof Error && received instanceof Error) {
    //         return false;
    //     }

    //     if (
    //         expectedType === 'object' &&
    //         typeof expected.asymmetricMatch === 'function'
    //     ) {
    //         return false;
    //     }

    //     if (
    //         receivedType === 'object' &&
    //         typeof received.asymmetricMatch === 'function'
    //     ) {
    //         return false;
    //     }

    //     return true;
    // }


    // /** https://github.com/facebook/jest/blob/cd98198c9397d8b69c55155d7b224d62ef117a90/packages/jest-matcher-utils/src/index.ts#L309 */
    // function printDiffOrStringify(expected, received, expectedLabel, receivedLabel, expand) {
    //     var MAX_DIFF_STRING_LENGTH = 20000;

    //     if (
    //         typeof expected === 'string' &&
    //         typeof received === 'string' &&
    //         expected.length !== 0 &&
    //         received.length !== 0 &&
    //         expected.length <= MAX_DIFF_STRING_LENGTH &&
    //         received.length <= MAX_DIFF_STRING_LENGTH &&
    //         expected !== received
    //     ) {
    //         if (expected.includes('\n') || received.includes('\n')) {
    //             // TODO: diffStringsUnified
    //             return pkg_jestdiff.diffStringsUnified(expected, received, {
    //                 aAnnotation: expectedLabel,
    //                 bAnnotation: receivedLabel,
    //                 changeLineTrailingSpaceColor: 'yellow', // chalk.bgYellow,
    //                 commonLineTrailingSpaceColor: 'yellow', // chalk.bgYellow,
    //                 emptyFirstOrLastLinePlaceholder: '↵', // U+21B5
    //                 expand: expand,
    //                 includeChangeCounts: true,
    //             });
    //         }

    //         var diffs = pkg_jestdiff.diffStringsRaw(expected, received, true);
    //         var hasCommonDiff = diffs.some(diff => diff[0] === DIFF_EQUAL);

    //         var printLabel = getLabelPrinter(expectedLabel, receivedLabel);
    //         var expectedLine =
    //             printLabel(expectedLabel) +
    //             printExpected(
    //                 getCommonAndChangedSubstrings(diffs, DIFF_DELETE, hasCommonDiff),
    //             );
    //         var receivedLine =
    //             printLabel(receivedLabel) +
    //             printReceived(
    //                 getCommonAndChangedSubstrings(diffs, DIFF_INSERT, hasCommonDiff),
    //             );

    //         return expectedLine + '\n' + receivedLine;
    //     }

    //     if (isLineDiffable(expected, received)) {
    //         var {
    //             replacedExpected,
    //             replacedReceived,
    //         } = replaceMatchedToAsymmetricMatcher(
    //             deepCyclicCopyReplaceable(expected),
    //             deepCyclicCopyReplaceable(received),
    //             [],
    //             [],
    //         );
    //         // TODO: diffDefault
    //         var difference = diffDefault(replacedExpected, replacedReceived, {
    //             aAnnotation: expectedLabel,
    //             bAnnotation: receivedLabel,
    //             expand: expand,
    //             includeChangeCounts: true,
    //         });

    //         if (
    //             typeof difference === 'string' &&
    //             difference.includes('- ' + expectedLabel) &&
    //             difference.includes('+ ' + receivedLabel)
    //         ) {
    //             return difference;
    //         }
    //     }

    //     var printLabel = getLabelPrinter(expectedLabel, receivedLabel);
    //     var expectedLine = printLabel(expectedLabel) + printExpected(expected);
    //     var receivedLine =
    //         printLabel(receivedLabel) +
    //         (stringify(expected) === stringify(received)
    //             ? 'serializes to the same string'
    //             : printReceived(received));

    //     return expectedLine + SINGLE_NEWLINE + receivedLine;
    // }