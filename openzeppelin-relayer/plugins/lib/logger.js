"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogInterceptor = void 0;
class LogInterceptor {
    constructor() {
        this.logs = [];
        // Store original console methods
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug,
        };
    }
    /**
     * Start intercepting console logs
     * @param outputToStdout - If true, outputs formatted logs to stdout immediately
     */
    start() {
        const createLogger = (level) => (...args) => {
            const message = args.map(arg => typeof arg === 'string' ? arg :
                arg instanceof Error ? arg.message :
                    JSON.stringify(arg)).join(' ');
            const logEntry = { level, message };
            this.logs.push(logEntry);
            this.originalConsole.log(JSON.stringify(logEntry));
        };
        console.log = createLogger("log");
        console.error = createLogger("error");
        console.warn = createLogger("warn");
        console.info = createLogger("info");
        console.debug = createLogger("debug");
    }
    /**
     * Add the result as a special log entry
     */
    addResult(message) {
        const logEntry = {
            level: "result",
            message: message,
        };
        this.logs.push(logEntry);
        this.originalConsole.log(JSON.stringify(logEntry));
    }
    /**
     * Stop intercepting and restore original console methods
     */
    stop() {
        Object.assign(console, this.originalConsole);
    }
    /**
     * Get all collected logs
     */
    getLogs() {
        return [...this.logs];
    }
}
exports.LogInterceptor = LogInterceptor;
