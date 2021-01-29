const bitcoin = require('bitcoinjs-lib')
const Client = require('bitcoin-core');
const crypto = require('crypto');
const ecc = require('tiny-secp256k1');


const network =bitcoin.networks.testnet;
const DEFAULT_SEQUENCE = 0xffffffff;
const SignAll = 1;

const  jacobAddr ='mwVo1aPkstdovMQq7jBNuFRhKg9ikrTXiy';
const  jacobWifPrvKey='cNtRhd91x3uUvinJ8s4jSSUsTHGm4LbQ6Ck2a3XiYZLaq5NpiBHw';
let    jacobUtxoTx = 'd0c951e5c86850afc3805163b5ceac3275d8e0e817c8a23e874e996e1accbb8a';
let     jacobUtxoIndex = '0';
let     jacobUtxoOutput = bitcoin.address.toOutputScript(jacobAddr,network);
let     jacobUtxoValue = 1388448;


const aliceAddr = 'msSQcobHao6H7Wt517u7bQpHMf7L8hgxYH';
const aliceWifPrvKey= 'cNC4dvXx7RtUSSHM6aWsMj8f67v4Jxxzy8EuARHZQu85hj8TGm5f';
let aliceUtxoTx = '69a2e2469feef3bbee834cd08fd0b5d573f64d8d8ff66ab507cc73f83010df25';
let aliceUtxoIndex = 0;
let aliceUtxoValue = 1383448;
let aliceUtxoOutput = buildSegOutput(aliceWifPrvKey);

const fee = 5000;


const  btcServerNet = {
    network: 'testnet',
    host: "52.40.34.234",
    port: 36893,
    username: 'wanglu',
    password: 'Wanchain888'
};

function buildSegAddr(wif){
    let p2wpkh = bitcoin.payments.p2wpkh({
        network:network,
        pubkey:bitcoin.ECPair.fromWIF(wif,network).publicKey,
    });
    console.log("address = %s",p2wpkh.address);
    console.log("output = %s",p2wpkh.output.toString('hex'));
    console.log("hash = %s",p2wpkh.hash.toString('hex'));

    return p2wpkh.address;
}

function buildSegOutput(wif){
    let p2wpkh = bitcoin.payments.p2wpkh({
        network:network,
        pubkey:bitcoin.ECPair.fromWIF(wif,network).publicKey,
    });
    // console.log("address = %s",p2wpkh.address);
    // console.log("output = %s",p2wpkh.output.toString('hex'));
    // console.log("hash = %s",p2wpkh.hash.toString('hex'));

    return p2wpkh.output;
}

function buildWitness(wif){
    let p2wpkh = bitcoin.payments.p2wpkh({
        network:network,
        pubkey:bitcoin.ECPair.fromWIF(wif,network).publicKey,
    });
    // console.log("address = %s",p2wpkh.address);
    // console.log("output = %s",p2wpkh.output.toString('hex'));
    // console.log("hash = %s",p2wpkh.hash.toString('hex'));

    return p2wpkh.witness;
}


buildSegAddr(aliceWifPrvKey);

// jacob->alice (send to alice segAddress)
async function sendTo(fromTx,fromIndex,fromScriptOutPut,scriptPubKey,value,fee){
    let txb = new bitcoin.TransactionBuilder(network);
    txb.setVersion(1);
    txb.setLockTime(0);
    txb.addInput(fromTx,fromIndex,DEFAULT_SEQUENCE,fromScriptOutPut);
    txb.addOutput(scriptPubKey,value-fee);

    txb.sign(fromIndex,bitcoin.ECPair.fromWIF(jacobWifPrvKey,network));
    await sendTrans(txb.build().toHex())
}

// alice->jacob  (Alice spend UTXO with seg)
async function sendBackBySeg(fromTx,fromIndex,fromScript,witnessScript,scriptPubKey,value,fee){
    let txb = new bitcoin.TransactionBuilder(network);
    txb.setVersion(1);
    txb.setLockTime(0);
    txb.addInput(fromTx,fromIndex,DEFAULT_SEQUENCE,fromScript);

    txb.addOutput(scriptPubKey,value-fee);

    txb.sign(fromIndex,
        bitcoin.ECPair.fromWIF(aliceWifPrvKey,network),
        null,
        1,
        value,
        witnessScript);
    await sendTrans(txb.build().toHex())
}

async function sendTrans(rawTx){
    let client = new Client(btcServerNet);
    let txHash = await client.sendRawTransaction(rawTx);
    return txHash
}

async function main(){
    // jacob发送到Alice隔离地址成功。
    // txHash : 69a2e2469feef3bbee834cd08fd0b5d573f64d8d8ff66ab507cc73f83010df25

    // await sendTo(jacobUtxoTx,parseInt(jacobUtxoIndex),jacobUtxoOutput,buildSegOutput(aliceWifPrvKey),jacobUtxoValue,fee);


    // Alice消费隔离地址，发回给Jacob
    // 交易成功：
    // txHash: 36b4c9d29952174474809c8b1c76fb5999f3833245ae50c7bddd1ef9bca68b64
    await sendBackBySeg(aliceUtxoTx,
        parseInt(aliceUtxoIndex),
        buildSegOutput(aliceWifPrvKey),
        buildWitness(aliceWifPrvKey),
        jacobUtxoOutput,
        aliceUtxoValue,
        fee)

};

main();
