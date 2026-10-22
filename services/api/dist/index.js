"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const config_1 = require("./config");
const app = (0, app_1.createApp)();
app.listen(config_1.config.port, '0.0.0.0', () => {
    console.log(`[Mani-Annan API] Server running on http://0.0.0.0:${config_1.config.port} (PORT=${config_1.config.port}, NODE_ENV=${config_1.config.nodeEnv})`);
});
