// TIMER FUNCTION HERE
/**
 * @param {function} workFunc  Callback containing the work to be done
 *                             for each interval
 * @param {int}      interval  Interval speed (in milliseconds) (combining with payment channel function this becomes how frequent 
 * user A transfer money to user B)
 * @param {float}    ratePerInterval how much TON (NOT in nano) is extracted from user A to B per interval
 */

 function AdjustingInterval(workFunc, interval, ratePerInterval) {
  var that = this;
  var expected, timeout;
  this.interval = interval;
  this.intervalNum = 0;
  this.ratePerInterval = ratePerInterval;

  this.start = function() {
      expected = Date.now() + this.interval;
      timeout = setTimeout(step, this.interval);
  }

  this.stop = function() {
      clearTimeout(timeout);
  }

  function step() {
      var drift = Date.now() - expected;
      that.intervalNum += 1;
      workFunc(that.intervalNum, that.ratePerInterval);
      expected += that.interval;
      timeout = setTimeout(step, Math.max(0, that.interval-drift));
  }
}

/////////////////////////////////////////////////////////////////////////////

// before the payment channel started, this is zero;
// once the payment channel started, for every microtransection, intervalNum increases by 1
var intervalNum = 0;

/////////////////////////////////////////////////////////////////////////////

// PAYMENT CHANNEL FUNCTION HERE

const TonWeb = require("tonweb");

const BN = TonWeb.utils.BN;

const toNano = TonWeb.utils.toNano;

const init = async () => {
  const providerUrl = 'https://testnet.toncenter.com/api/v2/jsonRPC'; // TON HTTP API url. Use this url for testnet
  const apiKey = 'MY_TEST_WALLET_API_KEY';
  const tonweb = new TonWeb(new TonWeb.HttpProvider(providerUrl, {apiKey})); // Initialize TON SDK

  //----------------------------------------------------------------------
  // PARTIES
  // The payment channel is established between two participants A and B.
  // Each has own secret key, which he does not reveal to the other.

  const seedA = TonWeb.utils.base64ToBytes('A_PRIVATE KEY'); // A's private (secret) key
  const keyPairA = tonweb.utils.keyPairFromSeed(seedA); // Obtain key pair (public key and private key)

  const seedB = TonWeb.utils.base64ToBytes('B_PRIVATE_KEY'); // B's private (secret) key
  const keyPairB = tonweb.utils.keyPairFromSeed(seedB); // Obtain key pair (public key and private key)

  // With a key pair, you can create a wallet.
  // To check you can use blockchain explorer https://testnet.tonscan.org/address/<WALLET_ADDRESS>

  const walletA = tonweb.wallet.create({
      publicKey: keyPairA.publicKey
  });
  const walletAddressA = await walletA.getAddress(); // address of this wallet in blockchain
  console.log('walletAddressA = ', walletAddressA.toString(true, true, true));

  const walletB = tonweb.wallet.create({
      publicKey: keyPairB.publicKey
  });
  const walletAddressB = await walletB.getAddress(); // address of this wallet in blockchain
  console.log('walletAddressB = ', walletAddressB.toString(true, true, true));

  //----------------------------------------------------------------------
  // PREPARE PAYMENT CHANNEL

  // The parties agree on the configuration of the payment channel.
  // They share information about the payment channel ID, their public keys, their wallet addresses for withdrawing coins, initial balances.
  // They share this information off-chain, for example via a websocket.

  const channelInitState = {
      balanceA: toNano('1'), // A's initial balance in Toncoins. Next A will need to make a top-up for this amount
      balanceB: toNano('2'), // B's initial balance in Toncoins. Next B will need to make a top-up for this amount
      seqnoA: new BN(0), // initially 0
      seqnoB: new BN(0)  // initially 0
  };

  const channelConfig = {
      channelId: new BN(124), // Channel ID, for each new channel there must be a new ID
      addressA: walletAddressA, // A's funds will be withdrawn to this wallet address after the channel is closed
      addressB: walletAddressB, // B's funds will be withdrawn to this wallet address after the channel is closed
      initBalanceA: channelInitState.balanceA,
      initBalanceB: channelInitState.balanceB
  }

  // Each on their side creates a payment channel object with this configuration

  const channelA = tonweb.payments.createChannel({
      ...channelConfig,
      isA: true,
      myKeyPair: keyPairA,
      hisPublicKey: keyPairB.publicKey,
  });

  const channelAddress = await channelA.getAddress(); // address of this payment channel smart-contract in blockchain
  console.log('channelAddressA=', channelAddress.toString(true, true, true));

  const channelB = tonweb.payments.createChannel({
      ...channelConfig,
      isA: false,
      myKeyPair: keyPairB,
      hisPublicKey: keyPairA.publicKey,
  });

  const channelAddressB = await channelB.getAddress(); // address of this payment channel smart-contract in blockchain
  console.log('channelAddressB=', channelAddressB.toString(true, true, true));

  if (channelAddressB.toString() !== channelAddress.toString()) {
      throw new Error('Channels address not same');
  }

  // Interaction with the smart contract of the payment channel is carried out by sending messages from the wallet to it.
  // So let's create helpers for such sends.

  const fromWalletA = channelA.fromWallet({
      wallet: walletA,
      secretKey: keyPairA.secretKey
  });

  const fromWalletB = channelB.fromWallet({
      wallet: walletB,
      secretKey: keyPairB.secretKey
  });

  //----------------------------------------------------------------------
  // NOTE:
  // Further we will interact with the blockchain.
  // After each interaction with the blockchain, we need to wait for execution. In the TON blockchain, this is usually about 5 seconds.
  // In this example, the interaction code happens right after each other - that won't work.
  // To study the example, you can put a `return` after each send.
  // In a real application, you will need to check that the smart contract of the channel has changed
  // (for example, by calling its get-method and checking the `state`) and only then do the following action.

  //----------------------------------------------------------------------
  // DEPLOY PAYMENT CHANNEL FROM WALLET A

  // Wallet A must have a balance.
  // 0.05 TON is the amount to execute this transaction on the blockchain. The unused portion will be returned.
  // After this action, a smart contract of our payment channel will be created in the blockchain.

  // To check you can use blockchain explorer https://testnet.tonscan.org/address/<CHANNEL_ADDRESS>
  // We can also call get methods on the channel (it's free) to get its current data.

  console.log(await channelA.getChannelState());
  const data = await channelA.getData();
  console.log('balanceA = ', data.balanceA.toString())
  console.log('balanceB = ', data.balanceB.toString())

  // TOP UP

  // Now each parties must send their initial balance from the wallet to the channel contract.

  await fromWalletA
      .topUp({coinsA: channelInitState.balanceA, coinsB: new BN(0)})
      .send(channelInitState.balanceA.add(toNano('0.05'))); // +0.05 TON to network fees

  await fromWalletB
      .topUp({coinsA: new BN(0), coinsB: channelInitState.balanceB})
      .send(channelInitState.balanceB.add(toNano('0.05'))); // +0.05 TON to network fees

  // to check, call the get method - the balances should change
  console.log(await tonweb.getBalance(walletAddressA))
  console.log(await tonweb.getBalance(walletAddressB))

  console.log('balanceA = ', data.balanceA.toString())
  console.log('balanceB = ', data.balanceB.toString())

  // INIT

  // After everyone has done top-up, we can initialize the channel from any wallet

  await fromWalletA.init(channelInitState).send(toNano('0.05'));

  // to check, call the get method - `state` should change to `TonWeb.payments.PaymentChannel.STATE_OPEN`

  // TODO: make a looop of keep subtracting from A's wallet to B's every minute, until stop conditions achieved

  // need to get state of ticker: while running, isRinning = true, else false;
  // do a while loop; while isRunning is true, for every 1 min, take money from A


  // here we actually do store all micro-transaction states, for extra security reason
  var channel_states = {}

  var balanceA_inTON = 1;
  var balanceB_inTON = 2;

  //----------------------------------------------------------------------
  
  // HERE ASSUME A KEEP GIVING MONEY TO B PER SECOND

  // this function will be run every IntervalNum; 
  // ratePerInterval number of TONs (not nano) will be transferred from A to B each interval
  var updateContract = async function(intervalNum, ratePerInterval) {
    console.log("We are in updateContract with intervalNum=", intervalNum);

    balanceA_inTON -= ratePerInterval;
    balanceB_inTON += ratePerInterval;

    channel_name = 'channelState' + intervalNum;
    console.log(channel_name)

    channel_states[channel_name] = {
      balanceA: toNano(balanceA_inTON.toFixed(8).toString()),
      balanceB: toNano(balanceB_inTON.toFixed(8).toString()),
      seqnoA: new BN(intervalNum),
      seqnoB: new BN(0),
    }
    
    var signatureA = await channelA.signState(channel_states[channel_name]);
    var signatureB = await channelB.signState(channel_states[channel_name]);
    if (!(await channelA.verifyState(channel_states[channel_name], signatureB))) {
      throw new Error('Invalid B signature');
    }
    console.log(channel_states[channel_name]);

    // NOTE: for testing/demonstration purpose, I set it here such that once intervalNum > 5, i.e. 5 seconds for the settings in this script, 
    //   the timer will be stopped and contract will be closed
    if (intervalNum > 5) {
      ticker.stop();
      await closeContract(intervalNum);
    }
  };

  var closeContract = async function(intervalNum) {
    channel_name = 'channelState' + intervalNum;
    var signatureCloseB = await channelB.signClose(channel_states[channel_name]);
    console.log(signatureCloseB);
    await fromWalletA.close({
        ...channel_states[channel_name],
        hisSignature: signatureCloseB
    }).send(toNano('0.05'));
    if (!(await channelA.verifyClose(channel_states[channel_name], signatureCloseB))) {
      throw new Error('Invalid B signature');
  }
    console.log('contract closed', signatureCloseB);
    console.log('balanceA = ', balanceA_inTON.toString())
    console.log('balanceB = ', balanceB_inTON.toString())

  }

  // where the timer and money transfer starts
  // Potential usage for this project (TODO): connect this script to the frontend. Once the two person starts calling, 
  //   the ticker will be started and updateContract will be called every 1000 milliseconds, 
  //   transferring (here) 0.00001 TON from user A to user B on each call of updateContract.
  // Once an 'end call' button is triggered, ticker.stop() will be triggered and hence close the contract
  var ticker = new AdjustingInterval(updateContract, 1000, 0.00001);

  channelOpened = true;
  ticker.start();
 
  return;
}
  
init();