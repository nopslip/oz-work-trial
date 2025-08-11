"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@jest/globals");
const plugin_1 = require("../../lib/plugin");
const relayer_sdk_1 = require("@openzeppelin/relayer-sdk");
const logger_1 = require("../../lib/logger");
const node_net_1 = __importDefault(require("node:net"));
jest.mock('../../lib/logger');
const MockedLogInterceptor = logger_1.LogInterceptor;
beforeAll(() => {
    jest.spyOn(process, 'exit').mockImplementation(((code) => {
        throw new Error(`process.exit called with "${code}"`);
    }));
});
describe('PluginAPI', () => {
    let pluginAPI;
    let mockSocket;
    let mockWrite;
    let mockEnd;
    let mockDestroy;
    beforeEach(() => {
        // Create mock socket
        mockWrite = jest.fn().mockReturnValue(true);
        mockEnd = jest.fn();
        mockDestroy = jest.fn();
        mockSocket = {
            write: mockWrite,
            end: mockEnd,
            destroy: mockDestroy,
            on: jest.fn(),
            createConnection: jest.fn(),
        };
        jest.spyOn(node_net_1.default, 'createConnection').mockReturnValue(mockSocket);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('constructor', () => {
        it('should create socket connection with provided path', () => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
            expect(node_net_1.default.createConnection).toHaveBeenCalledWith('/tmp/test.sock');
            expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockSocket.on).toHaveBeenCalledWith('data', expect.any(Function));
        });
        it('should initialize pending map', () => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
            expect(pluginAPI.pending).toBeInstanceOf(Map);
            expect(pluginAPI.pending.size).toBe(0);
        });
        it('should set up connection promise', () => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
            expect(pluginAPI._connectionPromise).toBeInstanceOf(Promise);
        });
    });
    describe('useRelayer', () => {
        beforeEach(() => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
        });
        it('should return relayer object with sendTransaction method', () => {
            const relayer = pluginAPI.useRelayer('test-relayer-id');
            expect(relayer).toHaveProperty('sendTransaction');
            expect(typeof relayer.sendTransaction).toBe('function');
        });
    });
    describe('_send', () => {
        beforeEach(() => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
            // Mock connection as established
            pluginAPI._connected = true;
        });
        it('should send message with correct format', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            const promise = pluginAPI._send('test-relayer', 'sendTransaction', payload);
            expect(mockWrite).toHaveBeenCalledWith(expect.stringMatching(/{"requestId":"[^"]+","relayerId":"test-relayer","method":"sendTransaction","payload":/), expect.any(Function));
        }));
        it('should add pending request to map', () => __awaiter(void 0, void 0, void 0, function* () {
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            const promise = pluginAPI._send('test-relayer', 'sendTransaction', payload);
            expect(pluginAPI.pending.size).toBe(1);
        }));
        it('should resolve when response is received', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            const promise = pluginAPI._send('test-relayer', 'sendTransaction', payload);
            // Get the requestId from the written message
            const writtenMessage = mockWrite.mock.calls[0][0];
            const messageObj = JSON.parse(writtenMessage);
            const requestId = messageObj.requestId;
            // Simulate response
            const response = {
                requestId,
                result: { id: 'tx-123', relayer_id: 'test-relayer', status: 'pending' },
                error: null,
            };
            // Trigger data event
            // @ts-expect-error: test code, type mismatch is not relevant
            const dataHandler = (_a = mockSocket.on.mock.calls.find(call => call[0] === 'data')) === null || _a === void 0 ? void 0 : _a[1];
            if (dataHandler) {
                dataHandler(Buffer.from(JSON.stringify(response) + '\n'));
            }
            const result = yield promise;
            expect(result).toEqual(response.result);
            expect(pluginAPI.pending.size).toBe(0);
        }));
        it('should reject when error response is received', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            const promise = pluginAPI._send('test-relayer', 'sendTransaction', payload);
            // Get the requestId from the written message
            const writtenMessage = mockWrite.mock.calls[0][0];
            const messageObj = JSON.parse(writtenMessage);
            const requestId = messageObj.requestId;
            // Simulate error response
            const response = {
                requestId,
                result: null,
                error: 'Transaction failed',
            };
            // Trigger data event
            // @ts-expect-error: test code, type mismatch is not relevant
            const dataHandler = (_a = mockSocket.on.mock.calls.find(call => call[0] === 'data')) === null || _a === void 0 ? void 0 : _a[1];
            if (dataHandler) {
                dataHandler(Buffer.from(JSON.stringify(response) + '\n'));
            }
            yield expect(promise).rejects.toBe('Transaction failed');
            expect(pluginAPI.pending.size).toBe(0);
        }));
        it('should wait for connection if not connected', () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            pluginAPI._connected = false;
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            const promise = pluginAPI._send('test-relayer', 'sendTransaction', payload);
            // Simulate connection
            // @ts-expect-error: test code, type mismatch is not relevant
            const connectHandler = (_a = mockSocket.on.mock.calls.find(call => call[0] === 'connect')) === null || _a === void 0 ? void 0 : _a[1];
            if (connectHandler) {
                connectHandler();
            }
            // Wait a bit for the promise to resolve and write to be called
            yield new Promise(resolve => setTimeout(resolve, 0));
            expect(mockWrite).toHaveBeenCalled();
        }));
        it('should throw error if write fails', () => __awaiter(void 0, void 0, void 0, function* () {
            mockWrite.mockReturnValue(false);
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            yield expect(pluginAPI._send('test-relayer', 'sendTransaction', payload))
                .rejects.toThrow('Failed to send message to relayer');
        }));
    });
    describe('close', () => {
        beforeEach(() => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
        });
        it('should end socket connection', () => {
            pluginAPI.close();
            expect(mockEnd).toHaveBeenCalled();
        });
    });
    describe('closeErrored', () => {
        beforeEach(() => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
        });
        it('should destroy socket with error', () => {
            const error = new Error('Test error');
            pluginAPI.closeErrored(error);
            expect(mockDestroy).toHaveBeenCalledWith(error);
        });
    });
    describe('integration with relayer.sendTransaction', () => {
        beforeEach(() => {
            pluginAPI = new plugin_1.DefaultPluginAPI('/tmp/test.sock');
            pluginAPI._connected = true;
        });
        it('should send transaction through relayer', () => __awaiter(void 0, void 0, void 0, function* () {
            const relayer = pluginAPI.useRelayer('test-relayer');
            const payload = {
                to: '0x1234567890123456789012345678901234567890',
                value: 1000000,
                data: '0x',
                gas_limit: 21000,
                speed: relayer_sdk_1.Speed.FAST,
            };
            const promise = relayer.sendTransaction(payload);
            expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('"method":"sendTransaction"'), expect.any(Function));
        }));
    });
});
