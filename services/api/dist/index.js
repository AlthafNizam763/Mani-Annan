"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const app = (0, app_1.createApp)();
app.listen(config_1.config.port, () => {
    console.log(`[Mani-Annan API] Server running on port ${config_1.config.port} in ${config_1.config.nodeEnv} mode`);
});
