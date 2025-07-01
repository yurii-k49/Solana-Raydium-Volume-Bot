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
exports.getSellTxWithJupiter = exports.getBuyTxWithJupiter = void 0;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("../constants");
const getBuyTxWithJupiter = (wallet, baseMint, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quoteResponse = yield (yield fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${baseMint.toBase58()}&amount=${amount}&slippageBps=${constants_1.SLIPPAGE}`)).json();
        // get serialized transactions for the swap
        const { swapTransaction } = yield (yield fetch("https://quote-api.jup.ag/v6/swap", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: wallet.publicKey.toString(),
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 100000
            }),
        })).json();
        // deserialize the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        var transaction = web3_js_1.VersionedTransaction.deserialize(swapTransactionBuf);
        // sign the transaction
        transaction.sign([wallet]);
        return transaction;
    }
    catch (error) {
        console.log("Failed to get buy transaction");
        return null;
    }
});
exports.getBuyTxWithJupiter = getBuyTxWithJupiter;
const getSellTxWithJupiter = (wallet, baseMint, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quoteResponse = yield (yield fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${baseMint.toBase58()}&outputMint=So11111111111111111111111111111111111111112&amount=${amount}&slippageBps=${constants_1.SLIPPAGE}`)).json();
        // get serialized transactions for the swap
        const { swapTransaction } = yield (yield fetch("https://quote-api.jup.ag/v6/swap", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: wallet.publicKey.toString(),
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 52000
            }),
        })).json();
        const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
        var transaction = web3_js_1.VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([wallet]);
        return transaction;
    }
    catch (error) {
        console.log("Failed to get sell transaction", error);
        return null;
    }
});
exports.getSellTxWithJupiter = getSellTxWithJupiter;
