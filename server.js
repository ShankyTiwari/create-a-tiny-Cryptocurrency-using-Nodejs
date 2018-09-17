/* 
 * @author Shashank Tiwari
 * create a tiny Cryptocurrency using Nodejs
 */

'use strict';

const express = require("express");
const http = require('http');
const bodyParser = require('body-parser');
const uuidv4 = require('uuid/v4');

const shaCoin = require('./shacoin');

class Server {

	constructor() {
		this.port = process.env.PORT || 4002;
		this.host = `localhost`;
		this.nodeAddress = uuidv4().toString().replace(/-/g, '');

		this.app = express();
		this.http = http.Server(this.app);
	}

  	appConfig() {
		this.app.use(
			bodyParser.json()
		);
		this.app.use(require("express").static('client'));
 	}

	/* Including app Routes starts*/
  	includeRoutes(app) {
		
		app.get("/mine_block", (request, response) => {
			const previousBlock = shaCoin.getLastBlock();
			const proof = shaCoin.proofOfWork({
				previousProof: previousBlock.proof
			});
			const previousHash = shaCoin.generateHash({
				block: previousBlock
			});
			shaCoin.addTransaction({
				amount: 1,
				sender: this.nodeAddress,
				receiver: 'Shashank'
			});
			const block = shaCoin.createBlock({
				previousHash: previousHash,
				proof: proof
			});
			const jsonResponse = {
				message: 'You mined a new Block.',
				index: block.index,
				timestamp: block.timestamp,
				data: block.data,
				proof: block.proof,
				previous_hash: block.previous_hash,
				transactions: block.transactions
			}
			response.status(200).json(jsonResponse);
		});

		app.get("/get_blockchain", (request, response) => {
			response.status(200).json({
				length: shaCoin.chain.length,
				blockchain: shaCoin.chain
			});
		});

		app.get("/is_blockchain_valid", (request, response) => {
			if (shaCoin.isChainValid()) {
				response.status(200).json({
					message: 'Your Blockchain is valid.',
					error: false
				});
			} else {
				response.status(417).json({
					message: 'Your Blockchain is invalid.',
					error: true
				});
			}
		});

		app.post('/add_transaction', (request, response) => {
			const sender = request.body.sender;
			const receiver = request.body.receiver;
			const amount = request.body.amount;

			if (sender === '' || sender === null) {
				response.status(400).json({
					error: true,
					message: `The Sender is missing.`
				});
			} else if (receiver === '' || receiver === null) {
				response.status(400).json({
					error: true,
					message: `The Receiver is missing.`
				});
			} else if (amount === '' || amount === null) {
				response.status(400).json({
					error: true,
					message: `The Amount is missing.`
				});
			} else {
				const blockIndex = shaCoin.addTransaction({
					amount: amount,
					sender: sender,
					receiver: receiver
				});
				response.status(201).json({
					error: true,
					message: `This transaction will be added to Block ${blockIndex}, After Mining.`
				});
			}
		});

		app.post('/connect_node', (request, response) => {
			const nodes = request.body.nodes;
			if (nodes === '' || nodes === null) {
				response.status(400).json({
					error: true,
					message: `No Nodes found.`
				});
			} else {
				if(nodes.length < 1) {
					response.status(400).json({
						error: true,
						message: `No Nodes found.`
					});
				} else {
					for (let index = 0; index < nodes.length; index++) {
						shaCoin.addNode({
							nodeAddress: nodes[index]
						});
					}
					response.status(201).json({
						'message': 'Distributed nodes are connected. Shacoin Blockchain contains the following nodes:',
						'total_nodes': Array.from(shaCoin.nodes)
					});
				}
			}
		});

		app.get('/replace_chain', async (request, response) => {
			const isChainReplaced = await shaCoin.replaceChain();
			if (isChainReplaced) {
				response.status(200).json({
					message: 'Since the distributed network had different blockchains, hence old blockchain is replaced by largest blockchain.',
					blockchain: shaCoin.chain
				});
			} else {
				response.status(200).json({
					message: 'Blockchain is not replaced.',
					blockchain: shaCoin.chain
				});
			}
		});
		
		app.get("**", function (req, response) {
			response.status(200).json({
				message: '404, Not Found.'
			});
		});
	}
	/* Including app Routes ends*/

	appExecute() {

		this.appConfig();
		this.includeRoutes(this.app);

		this.http.listen(this.port, this.host, () => {
			console.log(`Listening on http://${this.host}:${this.port}`);
		});
	}

}

const app = new Server();
app.appExecute();