import { Server } from 'socket.io';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Iniciando Socket.io...');
    const io = new Server(res.socket.server);
    
    const rooms = {};
    
    io.on('connection', (socket) => {
      console.log(`Novo cliente conectado: ${socket.id}`);
      
      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        rooms[roomId] = rooms[roomId] || { players: [], gameState: null };
        
        if (rooms[roomId].players.length >= 2) {
          socket.emit('roomFull');
          return;
        }
        
        rooms[roomId].players.push(socket.id);
        console.log(`Jogador ${socket.id} entrou na sala ${roomId}`);
        
        if (rooms[roomId].players.length === 2) {
          // Inicia o jogo quando 2 jogadores estão na sala
          const startingWord = getRandomStartingWord();
          rooms[roomId].gameState = {
            currentWord: startingWord,
            usedWords: [startingWord],
            currentPlayer: Math.floor(Math.random() * 2) + 1 // Jogador aleatório começa
          };
          
          io.to(roomId).emit('gameStart', rooms[roomId].gameState);
        }
      });
      
      socket.on('makeMove', ({ roomId, word }) => {
        const room = rooms[roomId];
        if (!room || !room.gameState) return;
        
        // Valida a jogada
        if (isValidMove(word, room.gameState)) {
          room.gameState.currentWord = word.toLowerCase();
          room.gameState.usedWords.push(word.toLowerCase());
          room.gameState.currentPlayer = room.gameState.currentPlayer === 1 ? 2 : 1;
          
          // Verifica fim de jogo
          const gameOver = checkGameOver(room.gameState);
          if (gameOver) {
            io.to(roomId).emit('gameOver', gameOver);
          } else {
            io.to(roomId).emit('gameUpdate', room.gameState);
          }
        } else {
          socket.emit('invalidMove');
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        // Limpa salas vazias
        for (const roomId in rooms) {
          rooms[roomId].players = rooms[roomId].players.filter(id => id !== socket.id);
          if (rooms[roomId].players.length === 0) {
            delete rooms[roomId];
          }
        }
      });
    });
    
    res.socket.server.io = io;
  }
  res.end();
}

// Funções auxiliares (implemente conforme sua lógica do jogo)
function getRandomStartingWord() {
  const words = ['abacaxi', 'banana', 'cachorro', 'dado', 'elefante'];
  return words[Math.floor(Math.random() * words.length)];
}

function isValidMove(word, gameState) {
  // Implemente a validação conforme suas regras
  return true;
}

function checkGameOver(gameState) {
  // Implemente a verificação de fim de jogo
  return null;
}