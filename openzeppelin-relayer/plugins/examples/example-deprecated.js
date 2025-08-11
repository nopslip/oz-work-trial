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
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_1 = require("../lib/plugin");
const relayer_sdk_1 = require("@openzeppelin/relayer-sdk");
function example(api, params) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info("Plugin started...");
        /**
         * Instances the relayer with the given id.
         */
        const relayer = api.useRelayer("sepolia-example");
        /**
         * Sends an arbitrary transaction through the relayer.
         */
        const result = yield relayer.sendTransaction({
            to: params.destinationAddress,
            value: 1,
            data: "0x",
            gas_limit: 21000,
            speed: relayer_sdk_1.Speed.FAST,
        });
        /*
        * Waits for the transaction to be mined on chain.
        */
        yield result.wait();
        return "done!";
    });
}
/**
 * This is the entry point for the plugin
 */
(0, plugin_1.runPlugin)(example);
