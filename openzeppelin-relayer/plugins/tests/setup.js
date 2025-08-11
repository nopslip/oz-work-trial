"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Jest setup file
const util_1 = require("util");
require("@jest/globals");
// Polyfill for TextEncoder/TextDecoder in Node.js test environment
global.TextEncoder = util_1.TextEncoder;
global.TextDecoder = util_1.TextDecoder;
// Increase timeout for integration tests
jest.setTimeout(30000);
// Mock console methods to avoid noise in tests
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
};
beforeEach(() => {
    // Suppress console output during tests unless explicitly needed
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
    jest.spyOn(console, 'info').mockImplementation(() => { });
    jest.spyOn(console, 'debug').mockImplementation(() => { });
});
afterEach(() => {
    jest.restoreAllMocks();
});
afterAll(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);
});
