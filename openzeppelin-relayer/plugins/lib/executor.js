#!/usr/bin/env node
"use strict";
/**
 * Plugin executor script for executing user plugins
 *
 * This is the main entry point for executing specific plugins from the Rust environment.
 * It serves as a bridge between the Rust relayer and TypeScript plugin ecosystem.
 *
 * Called from: src/services/plugins/script_executor.rs
 * The Rust code invokes this script via ts-node and passes parameters as command line arguments.
 *
 * This script:
 * 1. Receives plugin execution parameters from Rust via process.argv
 * 2. Loads the user's plugin script dynamically
 * 3. Calls the plugin's exported 'handler' function
 * 4. Returns results back to the Rust environment
 *
 * Usage: ts-node executor.ts <socket_path> <params_json> <user_script_path>
 *
 * Arguments:
 * - socket_path: Unix socket path for communication with relayer
 * - params_json: JSON string containing plugin parameters
 * - user_script_path: Path to the user's plugin file to execute
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("./plugin");
const logger_1 = require("./logger");
/**
 * Extract and validate CLI arguments passed from Rust script_executor.rs
 */
function extractCliArguments() {
    // Get arguments: [node, executor.ts, socketPath, paramsJson, userScriptPath]
    const socketPath = process.argv[2];
    const paramsJson = process.argv[3];
    const userScriptPath = process.argv[4];
    // Validate required arguments
    if (!socketPath) {
        throw new Error("Socket path is required (argument 1)");
    }
    if (!paramsJson) {
        throw new Error("Plugin parameters JSON is required (argument 2)");
    }
    if (!userScriptPath) {
        throw new Error("User script path is required (argument 3)");
    }
    return { socketPath, paramsJson, userScriptPath };
}
/**
 * Parse and validate plugin parameters
 */
function parsePluginParameters(paramsJson) {
    try {
        return JSON.parse(paramsJson);
    }
    catch (error) {
        throw new Error(`Failed to parse plugin parameters JSON: ${error instanceof Error ? error.message : error}`);
    }
}
/**
 * Main executor logic
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const logInterceptor = new logger_1.LogInterceptor();
        try {
            // Start intercepting all console output at the executor level
            // This provides better backward compatibility with existing scripts
            logInterceptor.start();
            // Extract and validate CLI arguments
            const { socketPath, paramsJson, userScriptPath } = extractCliArguments();
            // Parse plugin parameters
            const pluginParams = parsePluginParameters(paramsJson);
            // Execute plugin with validated parameters
            const result = yield (0, plugin_1.runUserPlugin)(socketPath, pluginParams, userScriptPath);
            // Add the result to LogInterceptor output
            logInterceptor.addResult((0, plugin_1.serializeResult)(result));
        }
        catch (error) {
            process.stderr.write(`Plugin executor failed: ${error instanceof Error ? error.message : error}\n`);
            process.exit(1);
        }
        finally {
            logInterceptor.stop();
            process.exit(0);
        }
    });
}
// Entry point for executor
main();
