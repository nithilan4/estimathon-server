const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
require('dotenv').config()
const fs = require("fs")

const questions = JSON.parse(fs.readFileSync("./questions.json").toString())

function scorePlayer(player) {
	const currentQuestionNum = gameState.question.num

	let score = 0
	let correctNum = 0
	for (const answeredQuestionNum in player.answers) {
		const answer = player.answers[answeredQuestionNum]
		if (answer.min <= questions[currentQuestionNum].a && answer.max >= questions[currentQuestionNum].a) {
			correctNum++
			score += Math.min(answer.max / answer.min, 500)
		}
	}

	score += (currentQuestionNum + 1 - correctNum) * 500


	return score
}


app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT, () => {
	console.log('listening on *:8000');
});

const io = require("socket.io")(server, {
	cors: {
		origin: '*',
	}
});

const initialGameState = {
	/*
		0: waiting for players to join
		1: in game
	*/
	status: 0,
	question: null, // null or { num (starting from 0), question: string }
	players: {

	},
	leaderboard: [],
	questionCount: questions.length
}

let gameState = null

function resetGame() {
	gameState = JSON.parse(JSON.stringify(initialGameState))
}

resetGame()

const sockets = {

}

let adminSocket = null

let endQuestionTimeout = null

const endDelay = 5 * 60 * 1000

io.on('connection', (socket) => {
	console.log('A user connected!');

	socket.on("join", (msg) => {
		if (!msg.name) return
		console.log(`${msg.name} Connected!`)
		if (msg.name == process.env.ADMIN_SECRET) {
			socket.data.admin = true

			adminSocket = socket

			socket.emit("set-admin")
			syncWithAdmin()
		} else {
			if (!(msg.name in sockets)) {
				socket.data.name = msg.name
				socket.data.admin = false
				sockets[msg.name] = socket

				let resume = true
				if (!(msg.name in gameState.players)) {
					gameState.players[msg.name] = {
						answers: {}
					}

					resume = false
				}

				socket.emit("join-result", {
					success: true,
					resume,
					gameState: {
						question: gameState.question,
						status: gameState.status
					}
				})

				syncWithAdmin()
				syncWithClients()
			} else {
				socket.emit("join-result", {
					success: false,
					error: "Name is already taken!"
				})
			}
		}
	})

	socket.on("reset-game", () => {
		if (socket.data.admin) {
			resetGame()

			for (const playerName of Object.keys(sockets)) {
				gameState.players[playerName] = {
					answers: {}
				}
			}

			syncWithAdmin()
			syncWithClients()
		}
	})

	socket.on("start-game", () => {
		if (socket.data.admin) {
			gameState.status = 1

			setQuestion(0)
		}
	})

	socket.on("end-question", () => {
		if (socket.data.admin) {
			endCurrentQuestion()
		}
	})

	socket.on("next-question", () => {
		if (socket.data.admin && gameState.question.num + 1 !== questions.length) {
			const nextQuestionIndex = gameState.question.num + 1

			setQuestion(nextQuestionIndex)
		}
	})

	socket.on("answer-question", (msg) => {
		if (gameState.status == 1 && gameState.question && socket.data.name in gameState.players) {
			if (msg.min && msg.max && msg.min == +msg.min && msg.max == +msg.max && +msg.min > 0) {
				gameState.players[socket.data.name].answers[gameState.question.num] = {
					min: msg.min,
					max: msg.max
				}

				syncWithAdmin()
				syncWithClients()
			}
		}
	})

	socket.on("disconnect", () => {
		delete sockets[socket.data.name]

		if (socket.data.name in gameState.players && Object.keys(gameState.players[socket.data.name].answers).length == 0) {
			delete gameState.players[socket.data.name] // no answers, we can kill this player without losing anything of value
		}

		syncWithAdmin()
	})
});

function syncWithAdmin() {
	if (adminSocket) {
		adminSocket.emit("sync-state", {
			gameState
		})
	}
}

function syncWithClients() {
	for (const socket of Object.values(sockets)) {
		console.log("emit to", socket.data.name)
		socket.emit("sync-state", {
			gameState: {
				...gameState,
				players: undefined,
				leaderboard: undefined,
				answered: gameState.question ? gameState.players[socket.data.name].answers[gameState.question.num] : false
			}
		})
	}
}

function setQuestion(index) {
	const due = Date.now() + endDelay
	gameState.question = {
		text: questions[index].q,
		closed: false,
		num: index,
		due
	}

	endQuestionTimeout = setTimeout(() => {
		endCurrentQuestion()
	}, due - Date.now())

	syncWithAdmin()
	syncWithClients()
}

function endCurrentQuestion() {
	clearTimeout(endQuestionTimeout)

	gameState.question.closed = true

	gameState.leaderboard = Object.keys(gameState.players).map(player => [player, scorePlayer(gameState.players[player])]).sort((a, b) => a - b).slice(0, gameState.question.num + 1 === questions.length ? undefined : 5)

	syncWithAdmin()
	syncWithClients()
}