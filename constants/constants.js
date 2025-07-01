"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKEN_MINT = exports.SLIPPAGE = exports.JITO_FEE = exports.JITO_MODE = exports.DISTRIBUTE_WALLET_NUM = exports.SELL_INTERVAL_MAX = exports.SELL_INTERVAL_MIN = exports.BUY_INTERVAL_MAX = exports.BUY_INTERVAL_MIN = exports.BUY_LOWER_PERCENT = exports.BUY_UPPER_PERCENT = exports.RPC_WEBSOCKET_ENDPOINT = exports.RPC_ENDPOINT = exports.PRIVATE_KEY = void 0;
const utils_1 = require("../utils");
exports.PRIVATE_KEY = (0, utils_1.retrieveEnvVariable)('PRIVATE_KEY', utils_1.logger);
exports.RPC_ENDPOINT = (0, utils_1.retrieveEnvVariable)('RPC_ENDPOINT', utils_1.logger);
exports.RPC_WEBSOCKET_ENDPOINT = (0, utils_1.retrieveEnvVariable)('RPC_WEBSOCKET_ENDPOINT', utils_1.logger);
exports.BUY_UPPER_PERCENT = Number((0, utils_1.retrieveEnvVariable)('BUY_UPPER_PERCENT', utils_1.logger));
exports.BUY_LOWER_PERCENT = Number((0, utils_1.retrieveEnvVariable)('BUY_LOWER_PERCENT', utils_1.logger));
exports.BUY_INTERVAL_MIN = Number((0, utils_1.retrieveEnvVariable)('BUY_INTERVAL_MIN', utils_1.logger));
exports.BUY_INTERVAL_MAX = Number((0, utils_1.retrieveEnvVariable)('BUY_INTERVAL_MAX', utils_1.logger));
exports.SELL_INTERVAL_MIN = Number((0, utils_1.retrieveEnvVariable)('SELL_INTERVAL_MIN', utils_1.logger));
exports.SELL_INTERVAL_MAX = Number((0, utils_1.retrieveEnvVariable)('SELL_INTERVAL_MAX', utils_1.logger));
exports.DISTRIBUTE_WALLET_NUM = Number((0, utils_1.retrieveEnvVariable)('DISTRIBUTE_WALLET_NUM', utils_1.logger));
exports.JITO_MODE = false
exports.JITO_FEE = 0.001;
exports.SLIPPAGE = Number((0, utils_1.retrieveEnvVariable)('SLIPPAGE', utils_1.logger));
exports.TOKEN_MINT = (0, utils_1.retrieveEnvVariable)('TOKEN_MINT', utils_1.logger);
