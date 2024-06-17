require('dotenv').config('../../../env');
const {
  Client,
  AccountId,
  PrivateKey,
  TokenId,
  TransactionId,
  TransferTransaction,
  TokenAssociateTransaction,
  Hbar,
  NftId,
  AccountAllowanceApproveTransaction,
} = require('@hashgraph/sdk');
const axios = require('axios');

const HBAR_DECIMAL = 100000000;
const PAL_TOKEN_ID = '0.0.1182820'
const palDecimals = 8;

const operatorId = AccountId.fromString(process.env.TREASURY_ID);
const operatorKey = PrivateKey.fromString(process.env.TREASURY_PVKEY);
const client = Client.forMainnet().setOperator(operatorId, operatorKey);
/*
const supplyKey = PrivateKey.fromString(process.env.SUPPLY_KEY);
const tokenId = TokenId.fromString(process.env.TOKEN_ID);
*/

exports.getAllowance = async (_accountId, _amount) => {
  try {
    const _response = await axios.get(`https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${_accountId}/allowances/crypto`);
    let _allowanceCheck = false;
    if (_response && _response.data.allowances && _response.data.allowances?.length > 0) {
      const _allowanceInfo = _response.data.allowances;
      console.log(_allowanceInfo);
      for (let i = 0; i < _allowanceInfo.length; i++) {
        if (_allowanceInfo[i].spender === operatorId.toString() && _allowanceInfo[i].amount_granted >= _amount * HBAR_DECIMAL) {
          _allowanceCheck = true;
          break;
        }
      }
    }
    if (!_allowanceCheck)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}

exports.receiveAllowanceNftsAndToken = async (sender, nftInfo, hbarAmount, palAmount) => {
  console.log('receiveAllowanceHbar log - 1 : ', sender, nftInfo, hbarAmount, palAmount);
  try {
    const sendHbarBal = new Hbar(hbarAmount); // Spender must generate the TX ID or be the client
    const sendPalBal = parseFloat(palAmount) * 10 ** palDecimals; // Spender must generate the TX ID or be the client

    const nftSendTx = new TransferTransaction()
      .addApprovedHbarTransfer(AccountId.fromString(sender), sendHbarBal.negated())
      .addHbarTransfer(operatorId, sendHbarBal)
      .addApprovedTokenTransfer(PAL_TOKEN_ID, AccountId.fromString(sender), -sendPalBal)
      .addTokenTransfer(PAL_TOKEN_ID, operatorId, sendPalBal);

    for (let i = 0; i < nftInfo.length; i++) {
      const _nft = new NftId(TokenId.fromString(nftInfo[i].tokenId), nftInfo[i].serialNum);
      nftSendTx.addApprovedNftTransfer(_nft, AccountId.fromString(sender), operatorId);
    }
    nftSendTx.setTransactionId(TransactionId.generate(operatorId)).freezeWith(client);
    const nftSendSign = await nftSendTx.sign(operatorKey);
    const nftSendSubmit = await nftSendSign.execute(client);
    const nftSendRx = await nftSendSubmit.getReceipt(client);
    if (nftSendRx.status._code != 22)
      return false;

    return true;
  } catch (error) {
    return false;
  }
}

exports.receiveAllowanceNft = async (sender, serialNum) => {
  console.log('receiveAllowanceNft log - 1 : ', sender, serialNum);
  try {
    const nft = new NftId(tokenId, serialNum);

    const approvedSendTx = new TransferTransaction()
      .addApprovedNftTransfer(nft, AccountId.fromString(sender), operatorId)
      .setTransactionId(TransactionId.generate(operatorId)) // Spender must generate the TX ID or be the client
      .freezeWith(client);
    const approvedSendSign = await approvedSendTx.sign(operatorKey);
    const approvedSendSubmit = await approvedSendSign.execute(client);
    const approvedSendRx = await approvedSendSubmit.getReceipt(client);

    if (approvedSendRx.status._code != 22)
      return false;

    return true;
  } catch (error) {
    return false;
  }
}
/*
exports.mintNft = async (CID) => {
    console.log('mintNft log - 1 : ', tokenId, CID);
    try {
        let mintTx = await new TokenMintTransaction()
            .setTokenId(tokenId)
            .setMetadata([Buffer.from(CID)])
            .freezeWith(client);
        let mintTxSign = await mintTx.sign(supplyKey);
        let mintTxSubmit = await mintTxSign.execute(client);
        let mintRx = await mintTxSubmit.getReceipt(client);
        console.log('mintNft log - 2 : ', mintRx);
        return mintRx.serials[0].low;
    } catch (error) {
        return 0;
    }
}

exports.burnNft = async (serialNum) => {
    console.log('burnNft log - 1 : ', serialNum);
    try {
        let tokenBurnTx = await new TokenBurnTransaction()
            .setTokenId(tokenId)
            .setSerials([serialNum])
            .freezeWith(client)
            .sign(supplyKey);
        let tokenBurnSubmit = await tokenBurnTx.execute(client);
        let tokenBurnRx = await tokenBurnSubmit.getReceipt(client);

        if (tokenBurnRx.status._code !== 22)
            return false;

        return true;
    } catch (error) {
        return false;
    }
}
*/
exports.sendHbar = async (receiverId, amount) => {
  console.log('sendHbar log - 1 : ', receiverId, amount);
  try {
    const transferTx = await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-amount))
      .addHbarTransfer(AccountId.fromString(receiverId), new Hbar(amount))
      .freezeWith(client)
      .sign(operatorKey);
    const transferSubmit = await transferTx.execute(client);
    const transferRx = await transferSubmit.getReceipt(client);

    if (transferRx.status._code !== 22)
      return false;

    return true;
  } catch (error) {
    return false;
  }
}

exports.sendNft = async (receiverId, serialNum) => {
  console.log('sendNft log - 1 : ', receiverId, serialNum);
  try {
    const transferTx = await new TransferTransaction()
      .addNftTransfer(
        TokenId.fromString(tokenId),
        serialNum,
        operatorId,
        AccountId.fromString(receiverId))
      .freezeWith(client)
      .sign(operatorKey);
    const transferSubmit = await transferTx.execute(client);
    const transferRx = await transferSubmit.getReceipt(client);

    if (transferRx.status._code !== 22)
      return false;

    return true;
  } catch (error) {
    return false;
  }
}

exports.claimTokenAndNfts = async (_swapCollection, _swapListData) => {
  console.log("claimTokenAndNfts log", _swapCollection, _swapListData);
  try {
    const transaction = new AccountAllowanceApproveTransaction();

    //   return res_.send({ result: false, error: "Something wrong." });
    console.log("claimRequest log approveHbarAllowance : ", _swapListData);
    if (_swapCollection.offerHbar != 0) {
      console.log("Hbar log ", _swapCollection.offerHbar);
      transaction.approveHbarAllowance(operatorId, AccountId.fromString(_swapCollection.accountId), _swapCollection.offerHbar);
    }
    if (_swapCollection.offerPal != 0) {
      console.log("Pal Token log ", _swapCollection.offerPal);
      const sendPalBal = parseFloat(_swapCollection.offerPal) * 10 ** palDecimals;

      transaction.approveTokenAllowance(PAL_TOKEN_ID, operatorId, AccountId.fromString(_swapCollection.accountId), sendPalBal);
    }

    if (_swapListData && _swapListData?.length > 0) {
      console.log("come in");
      for (let i = 0; i < _swapListData.length; i++) {
        transaction.approveTokenNftAllowance(new NftId(TokenId.fromString(_swapListData[i].tokenId), parseInt(_swapListData[i].serialNum)),
          operatorId, AccountId.fromString(_swapListData[i].accountId));
      }
      transaction.freezeWith(client);
    }

    const signTx = await transaction.sign(operatorKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const transactionStatus = receipt.status;
    console.log("The approve status is " + transactionStatus);

    if (transactionStatus != 22)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}

exports.associateCheck = async (tokenId) => {
  try {
    const checkingTokenId = tokenId;
    let tokenAssociatedFlag = false;

    let response = await axios.get(`https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${process.env.TREASURY_ID}/tokens`);
    let nextLink = response.data.links.next;
    while (1) {

      const nftData = response.data.tokens;

      for (let i = 0; i < nftData.length; i++) {
        if (nftData[i].token_id === checkingTokenId) {
          tokenAssociatedFlag = true;
          break;
        }
      }

      if (nextLink === null) break;
      response = await axios.get(`https://mainnet-public.mirrornode.hedera.com${nextLink}`);
      nextLink = response.data.links.next;
    }

    if (tokenAssociatedFlag)
      return true;

    return false;
  } catch (error) {
    return false;
  }
}

exports.setAssociate = async (tokenId) => {
  console.log("setAssociate log - 1 : ", tokenId);
  try {
    const checkingTokenId = tokenId;
    //Associate a token to an account and freeze the unsigned transaction for signing
    const transaction = await new TokenAssociateTransaction()
      .setAccountId(operatorId)
      .setTokenIds([TokenId.fromString(checkingTokenId)])
      .freezeWith(client);

    const signTx = await transaction.sign(operatorKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const transactionStatus = receipt.status;
    console.log("transactionStatus log", `Associate ${transactionStatus.toString()}!`);
    return true;
  } catch (error) {
    return false;
  }
}