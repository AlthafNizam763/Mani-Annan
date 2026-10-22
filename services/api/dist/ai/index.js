"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLLMProvider = void 0;
const geminiProvider_1 = require("./geminiProvider");
const mockProvider_1 = require("./mockProvider");
const config_1 = require("../config");
const getLLMProvider = () => {
    if (config_1.config.llm.provider === 'gemini' && config_1.config.llm.geminiApiKey) {
        return new geminiProvider_1.GeminiLLMProvider();
    }
    return new mockProvider_1.MockLLMProvider();
};
exports.getLLMProvider = getLLMProvider;
