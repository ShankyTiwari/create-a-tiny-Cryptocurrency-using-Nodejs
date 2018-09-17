/* 
* @author Shashank Tiwari
* create a tiny Cryptocurrency using Nodejs
*/
'use strict';

const SHA256 = require("crypto-js/sha256");
const url = require('url');
const axios = require('axios');

class ShaCoin {

	constructor() {
		this.chain = [];
		this.transactions = [];
		this.createBlock({previousHash: 0, proof: 1});
		this.nodes = new Set();
	}

	createBlock({ previousHash, proof }) {
		const block = {
			index: this.chain.length + 1,
			timestamp: (+new Date()).toString(),
			data: Math.random(),
			proof: proof,
			previous_hash: previousHash,
			transactions: this.transactions
		}
		this.transactions = [];
		this.chain.push(block);
		return block;
	}

	getLastBlock() {
		return this.chain[this.chain.length - 1] !== undefined ? this.chain[this.chain.length - 1] :  null;
	}

	proofOfWork({previousProof}) {
		let newProof = 1;
		let checkProof = false;
		while (!checkProof) {
			const blockHash = SHA256((Math.pow(newProof, 5) - Math.pow(previousProof, 5)).toString()).toString();
			if (blockHash.substring(0, 5) === '00000') {
				checkProof = true;
			} else {
				newProof++;
			}
		}
		return newProof;
	}

	generateHash({block}) {
		return SHA256(JSON.stringify(block)).toString();
	}

	isChainValid() {
		const chain = this.chain;
		let previousBlock = chain[0];
		let blockIndex = 1;
		while (blockIndex < chain.length) {
			const currentBlock = chain[blockIndex];
			if (currentBlock.previous_hash !== this.generateHash({
				block: previousBlock
			})) {
				return false;
			}
			const previousProof = previousBlock.proof;
			const currentProof = currentBlock.proof;
			const blockHash = SHA256((Math.pow(currentProof, 5) - Math.pow(previousProof, 5)).toString()).toString();
			if (blockHash.substring(0, 5) !== '00000') {
				return false;
			}
			previousBlock = currentBlock;
			blockIndex += 1;
		}
		return true;
	}

	addTransaction({amount, sender, receiver}) {
		this.transactions.push({
			amount: amount,
			sender: sender,
			receiver: receiver
		});
		const lastBlock = this.getLastBlock()
		return lastBlock.index + 1
	}

	addNode({nodeAddress}) {
		const urlComponents = url.parse(nodeAddress);
		this.nodes.add(urlComponents.href);
	}

	replaceChain() {
		return new Promise( async (resolve, reject) => {
			try {
				const promiseNetworkCall = [];
				const network = this.nodes;
				let longestChain = null;
				let maxChainLength = this.chain.length;
				network.forEach(node => {
					promiseNetworkCall.push(
						axios.get(`${node}get_blockchain`)
					);
				});
				const allNodeResponse = await axios.all(promiseNetworkCall);
				allNodeResponse.forEach((singleNodeResponse) => {
					if (singleNodeResponse.status === 200) {
						const newChainLength = singleNodeResponse.data.length;
						const newBlockchain = singleNodeResponse.data.blockchain;
						if (newChainLength > maxChainLength && this.isChainValid(newBlockchain)) {
							longestChain = newBlockchain;
							maxChainLength = newChainLength;
						}
					}
				});
				if (longestChain !== null) {
					this.chain = longestChain;
					resolve(true);
				} else {
					reject(true);
				}
			} catch (error) {
				reject(true);
			}
		});
	}

}

module.exports = new ShaCoin();
