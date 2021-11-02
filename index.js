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
exports.mainKp = exports.solanaConnection = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const bs58_1 = __importDefault(require("bs58"));
const swapOnlyAmm_1 = require("./utils/swapOnlyAmm");
const legacy_1 = require("./executor/legacy");
const jito_1 = require("./executor/jito");
exports.solanaConnection = new web3_js_1.Connection(constants_1.RPC_ENDPOINT, {
    wsEndpoint: constants_1.RPC_WEBSOCKET_ENDPOINT, commitment: "confirmed"
});
exports.mainKp = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(constants_1.PRIVATE_KEY));
const baseMint = new web3_js_1.PublicKey(constants_1.TOKEN_MINT);
const distritbutionNum = constants_1.DISTRIBUTE_WALLET_NUM > 20 ? 20 : constants_1.DISTRIBUTE_WALLET_NUM;
const jitoCommitment = "confirmed";
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const solBalance = yield exports.solanaConnection.getBalance(exports.mainKp.publicKey);
    console.log(`Volume bot is running`);
    console.log(`Wallet address: ${exports.mainKp.publicKey.toBase58()}`);
    console.log(`Pool token mint: ${baseMint.toBase58()}`);
    console.log(`Wallet SOL balance: ${(solBalance / web3_js_1.LAMPORTS_PER_SOL).toFixed(3)}SOL`);
    console.log(`Buying wait time max: ${constants_1.BUY_INTERVAL_MAX}s`);
    console.log(`Buying wait time min: ${constants_1.BUY_INTERVAL_MIN}s`);
    console.log(`Selling wait time max: ${constants_1.SELL_INTERVAL_MAX}s`);
    console.log(`Selling wait time min: ${constants_1.SELL_INTERVAL_MIN}s`);
    console.log(`Buy upper limit percent: ${constants_1.BUY_UPPER_PERCENT}%`);
    console.log(`Buy lower limit percent: ${constants_1.BUY_LOWER_PERCENT}%`);
    console.log(`Distribute SOL to ${distritbutionNum} wallets`);
    let data = null;
    if (solBalance < (constants_1.BUY_LOWER_PERCENT + 0.002) * distritbutionNum) {
        console.log("Sol balance is not enough for distribution");
    }
    data = yield distributeSol(exports.solanaConnection, exports.mainKp, distritbutionNum);
    if (data == null || data.length == 0) {
        console.log("Distribution failed");
        return;
    }
    data.map((_a, i_1) => __awaiter(void 0, [_a, i_1], void 0, function* ({ kp }, i) {
        yield (0, utils_1.sleep)(i * 5000);
        let srcKp = kp;
        while (true) {
            const BUY_WAIT_INTERVAL = Math.round(Math.random() * (constants_1.BUY_INTERVAL_MAX - constants_1.BUY_INTERVAL_MIN) + constants_1.BUY_INTERVAL_MIN);
            const SELL_WAIT_INTERVAL = Math.round(Math.random() * (constants_1.SELL_INTERVAL_MAX - constants_1.SELL_INTERVAL_MIN) + constants_1.SELL_INTERVAL_MIN);
            let buyAmount = 3_000_000;
            let i = 0;
            while (true) {
                try {
                    if (i > 10) {
                        console.log("Error in buy transaction");
                        return;
                    }
                    const result = yield buy(srcKp, baseMint, buyAmount);
                    if (result) {
                        break;
                    }
                    else {
                        i++;
                        yield (0, utils_1.sleep)(2000);
                    }
                }
                catch (error) {
                    i++;
                }
            }
            yield (0, utils_1.sleep)(BUY_WAIT_INTERVAL * 1000);
            let j = 0;
            while (true) {
                if (j > 10) {
                    console.log("Error in sell transaction");
                    return;
                }
                const result = yield sell(baseMint, srcKp);
                if (result) {
                    break;
                }
                else {
                    j++;
                    yield (0, utils_1.sleep)(2000);
                }
            }
            yield (0, utils_1.sleep)(SELL_WAIT_INTERVAL * 1000);
            const balance = yield exports.solanaConnection.getBalance(srcKp.publicKey);
            if (balance < 5 * 10 ** 6) {
                console.log("Sub wallet balance is not enough to continue volume swap");
                return;
            }
            let k = 0;
            while (true) {
                try {
                    if (k > 5) {
                        console.log("Failed to transfer SOL to new wallet in one of sub wallet");
                        return;
                    }
                    const destinationKp = web3_js_1.Keypair.generate();
                    const baseAta = (0, spl_token_1.getAssociatedTokenAddressSync)(baseMint, srcKp.publicKey);
                    (0, utils_1.saveDataToFile)([{
                            privateKey: bs58_1.default.encode(destinationKp.secretKey),
                            pubkey: destinationKp.publicKey.toBase58(),
                        }]);
                    const tx = new web3_js_1.Transaction().add(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }), web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20000 }), (0, spl_token_1.createCloseAccountInstruction)(baseAta, srcKp.publicKey, srcKp.publicKey), web3_js_1.SystemProgram.transfer({
                        fromPubkey: srcKp.publicKey,
                        toPubkey: destinationKp.publicKey,
                        lamports: balance - 17000 + 2039280
                    }));
                    tx.feePayer = srcKp.publicKey;
                    tx.recentBlockhash = (yield exports.solanaConnection.getLatestBlockhash()).blockhash;
                    const sig = yield (0, web3_js_1.sendAndConfirmTransaction)(exports.solanaConnection, tx, [srcKp], { skipPreflight: true, commitment: "finalized" });
                    srcKp = destinationKp;
                    console.log(`Transferred SOL to new wallet after buy and sell, https://solscan.io/tx/${sig}`);
                    break;
                }
                catch (error) {
                    k++;
                }
            }
        }
    }));
});
const distributeSol = (connection, mainKp, distritbutionNum) => __awaiter(void 0, void 0, void 0, function* () {
    const data = [];
    const wallets = [];
    try {
        const sendSolTx = [];
        sendSolTx.push(web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }), web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250000 }));
        const mainSolBal = yield connection.getBalance(mainKp.publicKey);
        if (mainSolBal <= 4 * 10 ** 6) {
            console.log("Main wallet balance is not enough");
            return [];
        }
        let solAmount = 7_000_000
        for (let i = 0; i < distritbutionNum; i++) {
            const wallet = web3_js_1.Keypair.generate();
            wallets.push({ kp: wallet, buyAmount: solAmount });
            sendSolTx.push(web3_js_1.SystemProgram.transfer({
                fromPubkey: mainKp.publicKey,
                toPubkey: wallet.publicKey,
                lamports: solAmount
            }));
        }
        wallets.map((wallet) => {
            data.push({
                privateKey: bs58_1.default.encode(wallet.kp.secretKey),
                pubkey: wallet.kp.publicKey.toBase58(),
            });
        });
        try {
            (0, utils_1.saveDataToFile)(data);
        }
        catch (error) {
        }
        let index = 0;
        while (true) {
            try {
                if (index > 5) {
                    console.log("Error in distribution");
                    return null;
                }
                const siTx = new web3_js_1.Transaction().add(...sendSolTx);
                const latestBlockhash = yield exports.solanaConnection.getLatestBlockhash();
                siTx.feePayer = mainKp.publicKey;
                siTx.recentBlockhash = latestBlockhash.blockhash;
                const messageV0 = new web3_js_1.TransactionMessage({
                    payerKey: mainKp.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: sendSolTx,
                }).compileToV0Message();
                const transaction = new web3_js_1.VersionedTransaction(messageV0);
                transaction.sign([mainKp]);
                let txSig;
                if (constants_1.JITO_MODE) {
                    txSig = yield (0, jito_1.executeJitoTx)([transaction], mainKp, jitoCommitment);
                }
                else {
                    txSig = yield (0, legacy_1.execute)(transaction, latestBlockhash, 1);
                }
                if (txSig) {
                    const distibuteTx = txSig ? `https://solscan.io/tx/${txSig}` : '';
                    console.log("SOL distributed ", distibuteTx);
                    break;
                }
                index++;
            }
            catch (error) {
                index++;
            }
        }
        console.log("Success in distribution");
        return wallets;
    }
    catch (error) {
        console.log(`Failed to transfer SOL`);
        return null;
    }
});
const buy = (newWallet, baseMint, buyAmount) => __awaiter(void 0, void 0, void 0, function* () {
    let solBalance = 0;
    try {
        solBalance = yield exports.solanaConnection.getBalance(newWallet.publicKey);
    }
    catch (error) {
        console.log("Error getting balance of wallet");
        return null;
    }
    if (solBalance == 0) {
        return null;
    }
    try {
        let buyTx = yield (0, swapOnlyAmm_1.getBuyTxWithJupiter)(newWallet, baseMint, buyAmount);
        if (buyTx == null) {
            console.log(`Error getting buy transaction`);
            return null;
        }
        let txSig;
        if (constants_1.JITO_MODE) {
            txSig = yield (0, jito_1.executeJitoTx)([buyTx], exports.mainKp, jitoCommitment);
        }
        else {
            const latestBlockhash = yield exports.solanaConnection.getLatestBlockhash();
            txSig = yield (0, legacy_1.execute)(buyTx, latestBlockhash, 1);
        }
        if (txSig) {
            const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : '';
            console.log("Success in buy transaction: ", tokenBuyTx);
            return tokenBuyTx;
        }
        else {
            return null;
        }
    }
    catch (error) {
        return null;
    }
});
const sell = (baseMint, wallet) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = (0, utils_1.readJson)();
        if (data.length == 0) {
            yield (0, utils_1.sleep)(1000);
            return null;
        }
        const tokenAta = yield (0, spl_token_1.getAssociatedTokenAddress)(baseMint, wallet.publicKey);
        const tokenBalInfo = yield exports.solanaConnection.getTokenAccountBalance(tokenAta);
        if (!tokenBalInfo) {
            console.log("Balance incorrect");
            return null;
        }
        const tokenBalance = tokenBalInfo.value.amount;
        try {
            let sellTx = yield (0, swapOnlyAmm_1.getSellTxWithJupiter)(wallet, baseMint, tokenBalance);
            if (sellTx == null) {
                console.log(`Error getting buy transaction`);
                return null;
            }
            let txSig;
            if (constants_1.JITO_MODE) {
                txSig = yield (0, jito_1.executeJitoTx)([sellTx], exports.mainKp, jitoCommitment);
            }
            else {
                const latestBlockhash = yield exports.solanaConnection.getLatestBlockhash();
                txSig = yield (0, legacy_1.execute)(sellTx, latestBlockhash, 1);
            }
            if (txSig) {
                const tokenSellTx = txSig ? `https://solscan.io/tx/${txSig}` : '';
                console.log("Success in sell transaction: ", tokenSellTx);
                return tokenSellTx;
            }
            else {
                return null;
            }
        }
        catch (error) {
            return null;
        }
    }
    catch (error) {
        return null;
    }
});
main();
