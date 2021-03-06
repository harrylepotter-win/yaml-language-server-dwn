"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const objects_1 = require("../src/languageservice/utils/objects");
const assert = require("assert");
describe('Object Equals Tests', () => {
    describe('Equals', function () {
        it('Both are null', () => {
            const one = null;
            const other = null;
            const result = objects_1.equals(one, other);
            assert.equal(result, true);
        });
        it('One is null the other is true', () => {
            const one = null;
            const other = true;
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('One is string the other is boolean', () => {
            const one = 'test';
            const other = false;
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('One is not object', () => {
            const one = 'test';
            const other = false;
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('One is array the other is not', () => {
            const one = new Proxy([], {});
            const other = Object.keys({
                1: '2',
                2: '3',
            });
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('Both are arrays of different length', () => {
            const one = [1, 2, 3];
            const other = [1, 2, 3, 4];
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('Both are arrays of same elements but in different order', () => {
            const one = [1, 2, 3];
            const other = [3, 2, 1];
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('Arrays that are equal', () => {
            const one = [1, 2, 3];
            const other = [1, 2, 3];
            const result = objects_1.equals(one, other);
            assert.equal(result, true);
        });
        it('Objects that are equal', () => {
            const one = {
                test: 1,
            };
            const other = {
                test: 1,
            };
            const result = objects_1.equals(one, other);
            assert.equal(result, true);
        });
        it('Objects that have same keys but different values', () => {
            const one = {
                test: 1,
            };
            const other = {
                test: 5,
            };
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
        it('Objects that have different keys', () => {
            const one = {
                test_one: 1,
            };
            const other = {
                test_other: 1,
            };
            const result = objects_1.equals(one, other);
            assert.equal(result, false);
        });
    });
});
//# sourceMappingURL=objects.test.js.map