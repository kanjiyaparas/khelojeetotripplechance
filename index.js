
const express = require("express");
const app = express();
const dotenv = require("dotenv");
const axios = require("axios");
const FormData = require("form-data");
dotenv.config();
connectDB = require("./config/db");
const http = require("http");
const cors = require("cors");
app.use(cors());
const db = connectDB();
const server = http.createServer(app);
app.use(express.json());
var io = require("socket.io")(server);
const tripleChance = require("./model/room");
const myData = require("./allData");

// Global variable to track running games
const runningGames = new Map();

async function sleep(timer) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timer);
  });
}

async function fetchBetData(roomId, gameId) {
  try {
    const formData = new URLSearchParams();
    formData.append("GameId", gameId);
    formData.append("gameName", "tripleChance");

    const response = await axios.post(
      "https://admin.khelojeetogame.com/api/player-bet-sum",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 5000,
      }
    );

    console.log("+++++++API Response+++++++++++:", response.data);
    
    return {
      totalBetSum: response.data.totalValueSum || 0,
      cardsValue1: response.data.cardValueSet || [],
      success: true
    };
  } catch (error) {
    console.error(
      "API Error:",
      error.response ? error.response.data : error.message
    );
    return {
      totalBetSum: 0,
      cardsValue1: [],
      success: false
    };
  }
}

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("joinRoom", async (body) => {
    try {
      let playerId = body.playerId;
      let name = body.name;
      let totalCoin = body.totalCoin;
      let profileImageUrl = body.profileImageUrl;
      let playerStatus = body.playerStatus;
      let gameName = body.gameName || "tripleChancePrint";

      let all = await tripleChance.find();
      let roomId = " ";

      all.every((element) => {
        if (element.isJoin == true) {
          roomId = element._id.toString();
          return false;
        }
        return true;
      });

      if (roomId == " ") {
        // CREATES A NEW ROOM IF NO EMPTY ROOM IS FOUND
        console.log(`Creating new room for ${name}`);

        let roomJJ = new tripleChance();

        let player = {
          socketID: socket.id,
          playerId: playerId,
          name: name,
          playerType: "Real Player",
          totalCoin: totalCoin,
          profileImageUrl: profileImageUrl,
          playerStatus: playerStatus,
        };

        roomJJ.players.push(player);
        roomJJ.gameName = gameName;

        let roomId = roomJJ._id.toString();

        socket.join(roomId);

        socket.emit("createRoomSuccess", roomJJ);
        roomJJ.isJoin = true;
        roomJJ = await roomJJ.save();
        io.to(roomId).emit("startGame", true);

        console.log("New room created:", roomJJ._id);
      } else {
        // JOINS A ROOM WHICH IS NOT FULL
        roomJJ = await tripleChance.findById(roomId);

        if (roomJJ.isJoin) {
          let player = {
            socketID: socket.id,
            playerId: playerId,
            name: name,
            playerType: "Real Player",
            totalCoin: totalCoin,
            profileImageUrl: profileImageUrl,
            playerStatus: playerStatus,
          };

          let players = roomJJ.players;

          // Check if player already exists
          let isExistingPlayer = players.some(
            (element) => element.playerId == playerId
          );

          if (isExistingPlayer) {
            // Remove existing player
            players = players.filter((element) => element.playerId != playerId);
            roomJJ.players = players;
            await roomJJ.save();
          }

          // Add new/updated player
          roomJJ.players.push(player);

          socket.join(roomId);

          roomJJ = await roomJJ.save();

          io.to(roomId).emit("updatedPlayers", roomJJ.players);
          socket.emit("updatedPlayer", player);
          io.to(roomId).emit("updatedRoom", roomJJ);
          io.to(roomId).emit("roomMessage", `${name} has joined the room.`);
          io.to(roomId).emit("gameId", roomJJ.gameId);
          io.to(roomId).emit("drawTime", roomJJ.draw_time);
        } else {
          socket.emit(
            "errorOccured",
            "Sorry! The Room is full. Please try again."
          );
          return;
        }
      }
    } catch (error) {
      console.log("Error in joinRoom:", error);
    }
  });

//  socket.on("start", async (body) => {
//     try {
//       console.log("---------------------------game started----------------------------");
//       let roomId = body.roomId;
//       let gameName = body.gameName || "tripleChancePrint";
      
//       // Check if game is already running for this room
//       if (runningGames.has(roomId)) {
//         console.log(`Game already running for room ${roomId}, skipping...`);
//         return;
//       }
      
//       // Mark game as running
//       runningGames.set(roomId, true);
      
//       var room = await tripleChance.findById(roomId);
//       if (!room) {
//         console.log(`Room ${roomId} not found`);
//         runningGames.delete(roomId);
//         return;
//       }
      
//       socket.join(roomId);
      
//       do {
//         var gameId = Math.floor(Date.now() / 1000).toString();
//         var draw_time = Math.floor(Date.now() / 1000 + 90);
//         room.draw_time = draw_time;
//         room.gameId = gameId;
//         room = await room.save();
//         io.to(roomId).emit("startBet", true);
//         io.to(roomId).emit("draw_time", room.draw_time);
//         io.to(roomId).emit("gameId", room.gameId);

//         for (let i = 0; i < 176; i++) {
//           io.to(roomId).emit("timer", 180 - i);
//           let roomJJ = await tripleChance.findById(roomId);
//           roomJJ.currentTime = (180 - i).toString();
//           roomJJ = await roomJJ.save();
//           await sleep(1000);
//           if (i == 175 && gameName == "tripleChancePrint") {
//             console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
//             console.log("Using local bet data instead of API call");
//             console.log("Total Bet Sum:", roomJJ.totalBetSum);
//             console.log("Mode:", roomJJ.mode);

//             io.to(roomId).emit("timer", 4);
//             break;
//           }

//           if (roomJJ === null) {
//             break;
//           }
//         }

//         let modeValue = roomJJ.mode || "none";
//         console.log(modeValue, "Current mode from database");

//         // io.to(roomId).emit("roomData", room)
//         io.to(roomId).emit("timer", 3);
//         console.log(3);
//         await sleep(1000);
//         io.to(roomId).emit("timer", 2);
//         console.log(2);
//         await sleep(1000);
//         io.to(roomId).emit("timer", 1);
//         console.log(1);
//         await sleep(1000);
//         io.to(roomId).emit("timer", 0);
//         console.log(0);
//         console.log(modeValue, "jjjjj");
//         room = await tripleChance.findById(roomId);
//         room.mode = modeValue;
//         console.log(room.mode, "hhhhhhhhhh");
//         room = await tripleChance.findById(roomId);
//         room = await room.save();
//         let count = 0;
//         console.log(room.mode, "++++++++++++++mode mil ya +++++++++++++");
        
//         // DIRECTLY GO TO ELSE PART - REMOVED THE IF CONDITION
//         console.log("else part mai agya hai");
//         if (room.mode == "Medium") {
//           console.log(room.mode, "309");
//           // console.log("+++++++++++no setMode is on+++++++++")
//           // console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
//           var room = await tripleChance.findById(roomId);
//           function findCardsInRange(arr) {
//             var array = arr;
//             // console.log(array, "++++187++++++")
//             let final = array.length - 1;
//             // console.log(final, "+++++final++++++++")
//             let initial = array.length - 1000;
//             // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//             // let totalSum = array.reduce((sum, num) => {
//             //     return sum + num.value
//             // }, 0)

//             var totalSum = room.totalBetSum;
//             // console.log(totalSum, "++++++++++totalSum++++++++++")
//             let finalArray = [];
//             let playerSumArray = [];
//             for (let i = final; i >= initial; i--) {
//               var card = array[i].card;
//               let value = array[i].value;
//               let tripleDigit = card;
//               let doubleDigit = card.slice(1);
//               let singleDigit = card.slice(2);
//               // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

//               let sum1 = 0,
//                 sum2 = 0,
//                 sum3 = 0;
//               let data1 = array.find(
//                 (element) => element.card === tripleDigit
//               );
//               sum1 = data1.value * 900;
//               // console.log(sum1,"sum111111111111")
//               let data2 = array.find(
//                 (element) => element.card === doubleDigit
//               );
//               sum2 = data2.value * 90;
//               // console.log(sum2,"sum22222222")
//               let data3 = array.find(
//                 (element) => element.card === singleDigit
//               );
//               sum3 = data3.value * 9;
//               // console.log(sum3,"sum3333333333")
//               let sum = sum1 + sum2 + sum3;
//               // console.log(sum)
//               if (sum <= 1 * totalSum && sum > 0 * totalSum) {
//                 finalArray.push(card);
//                 playerSumArray.push(sum);
//               }
//             }
//             return { finalArray, playerSumArray };
//           }
//           // Usage:
//           // console.log(room.cardsValue1, "+++229+++++")
//           let result = findCardsInRange(room.cardsValue1);
//           let output = result.finalArray;
//           let = result.playerSumArray;

//           let randomIndex = Math.floor(Math.random() * output.length);
//           // // const randomBet=loweArray[randomIndex]
//           console.log(randomIndex, "kkkkkk");
//           // const index=output.indexOf(randomBet)
//           if (randomIndex == -1 || output.length == 0) {
//             var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
//             console.log(slot);
//             io.to(roomId).emit("slot", slot);
//             console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//           } else {
//             var slot = output[randomIndex];
//             io.to(roomId).emit("slot", slot);
//             console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//           }

//           //    game_data_insert
//           const apiUrl1 =
//             "https://admin.khelojeetogame.com/api/live-data-from-node";
//           const requestData1 = {
//             win_number: slot.toString(),
//             game_name: "tripleChancePrint",
//           };

//           axios
//             .post(apiUrl1, requestData1)
//             .then((response) => {
//               console.log(
//                 response.data,
//                 "+++++++game Data insert data+++++++"
//               ); // Print the response data
//             })
//             .catch((error) => {
//               console.error(
//                 error,
//                 "++++++data nahi ayya error khaya++++++++"
//               ); // Print any errors
//             });

//           const apiUrl2 =
//             "https://admin.khelojeetogame.com/api/result-from-node";
//           const requestData2 = {
//             win_number: slot.toString(),
//             game_id: gameId,
//           };
//           console.log("Request Data:", requestData2);
//           //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
//           axios
//             .post(apiUrl2, requestData2)
//             .then((response) => {
//               console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
//             })
//             .catch((error) => {
//               console.error(
//                 error,
//                 "++++++data nahi ayya error khaya++++++++"
//               ); // Print any errors
//             });
//         } else if (room.mode == "High") {
//           console.log(room.mode, "396");
//           console.log("+++++++++++setMode is on+++++++++");
//           console.log(
//             "+++++++++++++++++++High++++++++++++++++++++++++++++++++"
//           );
//           var room = await tripleChance.findById(roomId);
//           function findCardsInRange(arr) {
//             var array = arr;
//             // console.log("++++++++++ghus gya  mai+++++++++++++")
//             let final = array.length - 1;
//             // console.log(final, "+++++final++++++++")
//             let initial = array.length - 1000;
//             // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//             // let totalSum = array.reduce((sum, num) => {
//             //     return sum + num.value
//             // }, 0)
//             var totalSum = room.totalBetSum;
//             // console.log(totalSum, "++++++++++totalSum++++++++++")
//             let finalArray = [];
//             let playerSumArray = [];
//             for (let i = final; i >= initial; i--) {
//               var card = array[i].card;
//               let value = array[i].value;
//               let tripleDigit = card;
//               let doubleDigit = card.slice(1);
//               let singleDigit = card.slice(2);
//               // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

//               let sum1 = 0;
//               let sum2 = 0;
//               let sum3 = 0;
//               let data1 = array.find(
//                 (element) => element.card === tripleDigit
//               );
//               sum1 = data1.value * 900;
//               // console.log(sum1,"sum111111111111")
//               let data2 = array.find(
//                 (element) => element.card === doubleDigit
//               );
//               sum2 = data2.value * 90;
//               // console.log(sum2,"sum22222222")
//               let data3 = array.find(
//                 (element) => element.card === singleDigit
//               );
//               sum3 = data3.value * 9;
//               // console.log(sum3,"sum3333333333")
//               let sum = sum1 + sum2 + sum3;
//               // console.log(sum)

//               finalArray.push(card);
//               playerSumArray.push(sum);
//             }
//             return { finalArray, playerSumArray };
//           }
//           // Usage:
//           let result = findCardsInRange(room.cardsValue1);
//           let output = result.finalArray;
//           console.log(output.length, "kkkk");
//           let outputPlayerSumArray = result.playerSumArray;

//           //checking if bet==0then random result will be shouwn
//           var room = await tripleChance.findById(roomId);
//           var totalSum = room.totalBetSum;
//           var slot;
//           if (totalSum == 0) {
//             console.log("sum is zero");
//             let RandomIndex = Math.floor(Math.random() * output.length);
//             console.log(typeof RandomIndex, "RandomIndex");
//             // console.log( RandomIndex )
//             slot = output[RandomIndex];
//             console.log(typeof slot, "kkkkk");
//           } else if (output.length == 0) {
//             console.log("output length is zero");
//             let RandomNumber = Math.floor(Math.random() * 800) + 100;
//             let stringRandomNumber = RandomNumber.toString();
//             console.log(typeof stringRandomNumber, "RandomIndex");
//             slot = stringRandomNumber;
//           } else {
//             let correspondingIndex = [];

//             let maxNumber = Math.max(...outputPlayerSumArray);
//             for (let element of outputPlayerSumArray) {
//               if (element == maxNumber) {
//                 let index = outputPlayerSumArray.indexOf(element);
//                 correspondingIndex.push(output[index]);
//                 outputPlayerSumArray.splice(index, 1);
//                 output.splice(index, 1);
//               }
//             }

//             console.log(
//               correspondingIndex,
//               "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu"
//             );
//             let indexes = Math.floor(
//               Math.random() * correspondingIndex.length
//             );
//             console.log(correspondingIndex[indexes]);
//             slot = correspondingIndex[indexes];
//           }
//           io.to(roomId).emit("slot", slot);
//           console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

//           //    game_data_insert
//           const apiUrl1 =
//             "https://admin.khelojeetogame.com/api/live-data-from-node";
//           const requestData1 = {
//             win_number: slot.toString(),
//             game_name: "tripleChancePrint",
//           };

//           axios
//             .post(apiUrl1, requestData1)
//             .then((response) => {
//               console.log(
//                 response.data,
//                 "+++++++game Data insert data+++++++"
//               ); // Print the response data
//             })
//             .catch((error) => {
//               console.error(
//                 error,
//                 "++++++data nahi ayya error khaya++++++++"
//               ); // Print any errors
//             });

//           // all data of the user

//           const apiUrl2 =
//             "https://admin.khelojeetogame.com/api/result-from-node";
//           const requestData2 = {
//             win_number: slot.toString(),
//             game_id: gameId,
//           };
//           console.log("Request Data:", requestData2);
//           //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
//           axios
//             .post(apiUrl2, requestData2)
//             .then((response) => {
//               console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
//             })
//             .catch((error) => {
//               console.error(
//                 error,
//                 "++++++data nahi ayya error khaya++++++++"
//               ); // Print any errors
//             });
//         } else if (room.mode == "Low") {
//           console.log("+++++++++++low setMode is on+++++++++");
//           console.log(
//             "+++++++++++++++++++low++++++++++++++++++++++++++++++++"
//           );
//           room = await tripleChance.findById(roomId);
//           function findCardsInRange(arr) {
//             var array = arr;
//             // console.log("++++++++++ghus gya  mai+++++++++++++")
//             let final = array.length - 1;
//             // console.log(final, "+++++final++++++++")
//             let initial = array.length - 1000;
//             // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//             let totalSum = array.reduce((sum, num) => {
//               return sum + num.value;
//             }, 0);

//             // var totalSum=room.totalBetSum
//             // console.log(totalSum, "++++++++++totalSum++++++++++")
//             let finalArray = [];
//             let playerSumArray = [];
//             for (let i = final; i >= initial; i--) {
//               var card = array[i].card;
//               let value = array[i].value;
//               let tripleDigit = card;
//               let doubleDigit = card.slice(1);
//               let singleDigit = card.slice(2);
//               // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

//               let sum1 = 0;
//               let sum2 = 0;
//               let sum3 = 0;
//               let data1 = array.find(
//                 (element) => element.card === tripleDigit
//               );
//               sum1 = data1.value * 900;
//               // console.log(sum1,"sum111111111111")
//               let data2 = array.find(
//                 (element) => element.card === doubleDigit
//               );
//               sum2 = data2.value * 90;
//               // console.log(sum2,"sum22222222")
//               let data3 = array.find(
//                 (element) => element.card === singleDigit
//               );
//               sum3 = data3.value * 9;
//               // console.log(sum3,"sum3333333333")
//               let sum = sum1 + sum2 + sum3;
//               // console.log(sum)

//               finalArray.push(card);
//               playerSumArray.push(sum);
//             }
//             return { finalArray, playerSumArray };
//           }
//           // Usage:
//           let result = findCardsInRange(room.cardsValue1);
//           let output = result.finalArray;
//           let outputPlayerSumArray = result.playerSumArray;
//           // console.log(output, "186666666666")
//           // console.log(outputPlayerSumArray, "17666666666666")

//           const minNumber = Math.min(...outputPlayerSumArray);
//           // console.log("Minimum Number:", minNumber);
//           let indexArray = [];
//           for (let i = 0; i < outputPlayerSumArray.length; i++) {
//             if (outputPlayerSumArray[i] === minNumber) {
//               indexArray.push(i);
//             }
//           }

//           // console.log("Indices of minimum number:", indexArray);

//           let n = Math.floor(Math.random() * indexArray.length); // Removed -1
//           // console.log("Random index:", n);

//           const randomIndex = indexArray[n];
//           // console.log("Corresponding random index from array1:", randomIndex);

//           const slot = output[randomIndex];
//           // console.log("Corresponding value from output:", slot);

//           io.to(roomId).emit("slot", slot);
//           console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

//           //    game_data_insert
//           const apiUrl1 =
//             "https://admin.khelojeetogame.com/api/live-data-from-node";
//           const requestData1 = {
//             win_number: slot.toString(),
//             game_name: "tripleChancePrint",
//           };

//           axios
//             .post(apiUrl1, requestData1)
//             .then((response) => {
//               console.log(
//                 response.data,
//                 "+++++++game Data insert data+++++++"
//               ); // Print the response data
//             })
//             .catch((error) => {
//               console.error(
//                 error,
//                 "++++++data nahi ayya error khaya++++++++"
//               ); // Print any errors
//             });

//           // all data of the user

//           const apiUrl2 =
//             "https://admin.khelojeetogame.com/api/result-from-node";
//           const requestData2 = {
//             win_number: slot.toString(),
//             game_id: gameId,
//           };
//           console.log("Request Data:", requestData2);
//           //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
//           axios
//             .post(apiUrl2, requestData2)
//             .then((response) => {
//               console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
//             })
//             .catch((error) => {
//               console.error(
//                 error,
//                 "++++++data nahi ayya error khaya++++++++"
//               ); // Print any errors
//             });
//         } else {
//           if (room.mode == "HighMedium") {
//             // mode will be high Medium
//             console.log("+++++++++++ setMode is on+++++++++");
//             console.log(
//               "+++++++++++++++++++High Medium++++++++++++++++++++++++++++++++"
//             );
//             var room = await tripleChance.findById(roomId);
//             function findCardsInRange(arr) {
//               var array = arr;
//               console.log("++++++++++ghus gya  mai+++++++++++++");
//               let final = array.length - 1;
//               console.log(final, "+++++final++++++++");
//               let initial = array.length - 1000;
//               console.log(initial, "+++++++++++++initial++++++++++++++++++");
//               // let totalSum = array.reduce((sum, num) => {
//               //     return sum + num.value
//               // }, 0)

//               var totalSum = room.totalBetSum;
//               console.log(totalSum, "++++++++++totalSum++++++++++");
//               let finalArray = [];
//               let playerSumArray = [];
//               for (let i = final; i >= initial; i--) {
//                 var card = array[i].card;
//                 let value = array[i].value;
//                 let tripleDigit = card;
//                 let doubleDigit = card.slice(1);
//                 let singleDigit = card.slice(2);
//                 // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")
//                 let sum1 = 0;
//                 let sum2 = 0;
//                 let sum3 = 0;
//                 let data1 = array.find(
//                   (element) => element.card === tripleDigit
//                 );
//                 sum1 = data1.value * 900;
//                 // console.log(sum1,"sum111111111111")
//                 let data2 = array.find(
//                   (element) => element.card === doubleDigit
//                 );
//                 sum2 = data2.value * 90;
//                 // console.log(sum2,"sum22222222")
//                 let data3 = array.find(
//                   (element) => element.card === singleDigit
//                 );
//                 sum3 = data3.value * 9;
//                 // console.log(sum3,"sum3333333333")
//                 let sum = sum1 + sum2 + sum3;
//                 // console.log(sum)
//                 if (
//                   (sum < 1 * totalSum && sum > 0.8 * totalSum) ||
//                   (sum > 0.5 * totalSum && sum < 1.1 * totalSum) ||
//                   (sum > 0.4 * totalSum && sum < 1.1 * totalSum) ||
//                   (sum > 0.0 * totalSum && sum < 1.1 * totalSum) ||
//                   (sum > 0.5 * totalSum && sum < 2 * totalSum)
//                 ) {
//                   finalArray.push(card);
//                   playerSumArray.push(sum);
//                 }
//               }
//               return { finalArray, playerSumArray };
//             }
//             // Usage:
//             let result = findCardsInRange(room.cardsValue1);
//             let output = result.finalArray;
//             let outputPlayerSumArray = result.playerSumArray;
//             console.log(outputPlayerSumArray, "+++++outplayerSumArray++++++++");
//             let filterElement = [];
//             let filterElementCorrespondingSlot = [];
//             var room = await tripleChance.findById(roomId);
//             var totalSum = room.totalBetSum;
//             for (let i = 0; i < outputPlayerSumArray.length; i++) {
//               if (outputPlayerSumArray[i] < totalSum) {
//                 filterElement.push(outputPlayerSumArray[i]);
//                 filterElementCorrespondingSlot.push(i);
//               }
//             }
//             console.log(filterElement, "+++++++++++filterElament++++++++");
//             if (filterElement.length > 0) {
//               console.log("++++filter wla amai enter kar gaya+++++");
//               // const sortedArray1 = filterElement.sort((a, b) => a - b);
//               const randomNumber = Math.floor(
//                 Math.random() * filterElement.length - 1
//               );
//               console.log(randomNumber, "ppppppppppp");
//               const thirdMax = filterElementCorrespondingSlot[randomNumber];
//               // const thirdMaxIndex = outputPlayerSumArray.indexOf(thirdMax);
//               console.log(output);
//               // Step 2: Get the corresponding slot from array2 using the index obtained from array1
//               var slot = output[thirdMax];
//               console.log(slot, "kkkkkk");
//             } else if (output.length == 0) {
//               console.log("output length is zero");
//               let RandomNumber = Math.floor(Math.random() * 800) + 100;
//               let stringRandomNumber = RandomNumber.toString();
//               console.log(typeof stringRandomNumber, "RandomIndex");
//               var slot = stringRandomNumber;
//               console.log(slot, "LLLLL");
//             } else {
//               const randomNumber = Math.floor(Math.random() * output.length);
//               const slot = output[randomNumber];

//               console.log(slot, "MMMMMMMM");
//             }
//             io.to(roomId).emit("slot", slot);
//             console.log(slot);
//             // game_data_insert
//             const apiUrl1 =
//               "https://admin.khelojeetogame.com/api/live-data-from-node";
//             const requestData1 = {
//               win_number: slot.toString(),
//               game_name: "tripleChancePrint",
//             };

//             axios
//               .post(apiUrl1, requestData1)
//               .then((response) => {
//                 console.log(
//                   response.data,
//                   "+++++++game Data insert data+++++++"
//                 ); // Print the response data
//               })
//               .catch((error) => {
//                 console.error(
//                   error,
//                   "++++++data nahi ayya error khaya++++++++"
//                 ); // Print any errors
//               });
//             // all data of the user

//             const apiUrl2 =
//               "https://admin.khelojeetogame.com/api/result-from-node";
//             const requestData2 = {
//               win_number: slot.toString(),
//               game_id: gameId,
//             };
//             console.log("Request Data:", requestData2);
//             //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
//             axios
//               .post(apiUrl2, requestData2)
//               .then((response) => {
//                 console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
//               })
//               .catch((error) => {
//                 console.error(
//                   error,
//                   "++++++data nahi ayya error khaya++++++++"
//                 ); // Print any errors
//               });
//           }
//         }

//         room.cardsValue1 = myData;
//         room.totalBetSum = 0;
//         room.mode = "Medium";

//         await room.save();

//         console.log("one round complete");
//         await sleep(18000);

//         const deleteX = async () => {
//           try {
//             const response = await axios.post(
//               `https://admin.khelojeetogame.com/api/delete-x-entry?game_name=${gameName}`,
//               {},
//               {
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//               }
//             );
//             return response.data;
//           } catch (error) {
//             console.error("Error deleting slot:", error.response?.data || error.message);
//             return null;
//           }
//         };

//         deleteX().then((data) => {
//           if (data) {
//             const deletionResult = data.message;
//             console.log("++++Deletion response++++:", deletionResult);
//           }
//         });

//         if (room.players.length === 0) {
//           room = await tripleChance.deleteOne({ _id: roomId });
//         }

//         room = await tripleChance.findById(roomId);

//       } while (room != null && room.players.length > 0);
      
//       // Clean up running game
//       runningGames.delete(roomId);
      
//     } catch (error) {
//       console.log("Error in start event:", error);
//       // Clean up on error
//       runningGames.delete(roomId);
//     }
//   });

socket.on("start", async (body) => {
    try {
      console.log("---------------------------game started----------------------------");
      let roomId = body.roomId;
      let gameName = body.gameName || "tripleChancePrint";
      
      // Check if game is already running for this room
      if (runningGames.has(roomId)) {
        console.log(`Game already running for room ${roomId}, skipping...`);
        return;
      }
      
      // Mark game as running
      runningGames.set(roomId, true);
      
      var room = await tripleChance.findById(roomId);
      if (!room) {
        console.log(`Room ${roomId} not found`);
        runningGames.delete(roomId);
        return;
      }
      
      socket.join(roomId);
      
      do {
        var gameId = Math.floor(Date.now() / 1000).toString();
        var draw_time = Math.floor(Date.now() / 1000 + 90);
        room.draw_time = draw_time;
        room.gameId = gameId;
        room = await room.save();
        io.to(roomId).emit("startBet", true);
        io.to(roomId).emit("draw_time", room.draw_time);
        io.to(roomId).emit("gameId", room.gameId);

        for (let i = 0; i < 176; i++) {
          io.to(roomId).emit("timer", 180 - i);
          let roomJJ = await tripleChance.findById(roomId);
          roomJJ.currentTime = (180 - i).toString();
          roomJJ = await roomJJ.save();
          await sleep(1000);
          if (i == 175 && gameName == "tripleChancePrint") {
            console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            console.log("Using local bet data instead of API call");
            console.log("Total Bet Sum:", roomJJ.totalBetSum);
            console.log("Mode:", roomJJ.mode);

            io.to(roomId).emit("timer", 4);
            break;
          }

          if (roomJJ === null) {
            break;
          }
        }

        let modeValue = roomJJ.mode || "none";
        console.log(modeValue, "Current mode from database");

        // io.to(roomId).emit("roomData", room)
        io.to(roomId).emit("timer", 3);
        console.log(3);
        await sleep(1000);
        io.to(roomId).emit("timer", 2);
        console.log(2);
        await sleep(1000);
        io.to(roomId).emit("timer", 1);
        console.log(1);
        await sleep(1000);
        io.to(roomId).emit("timer", 0);
        console.log(0);
        console.log(modeValue, "jjjjj");
        room = await tripleChance.findById(roomId);
        room.mode = modeValue;
        console.log(room.mode, "hhhhhhhhhh");
        room = await tripleChance.findById(roomId);
        room = await room.save();
        let count = 0;
        console.log(room.mode, "++++++++++++++mode mil ya +++++++++++++");
        
        // DIRECTLY GO TO ELSE PART - REMOVED THE IF CONDITION
        console.log("else part mai agya hai");
        if (room.mode == "Medium") {
          
          // API call for bet data
          const betData = await fetchBetData(roomId, room.gameId);
          if (betData.success) {
            room.totalBetSum = betData.totalBetSum;
            room.cardsValue1 = betData.cardsValue1;
            await room.save();
          }

          console.log(room.mode, "309 (Updated Medium Logic)");
          console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++");
          
          var room = await tripleChance.findById(roomId);

          // Function to calculate all card/payout sums (re-factored for clarity)
          function calculateAllPayouts(arr) {
            const array = arr;
            const final = array.length - 1;
            const initial = Math.max(0, array.length - 1000); 

            const allCards = []; 
            const allPayouts = []; 

            for (let i = final; i >= initial; i--) {
              const card = array[i].card;
              const tripleDigit = card;
              const doubleDigit = card.slice(1);
              const singleDigit = card.slice(2);

              let sum1 = 0; // Triple
              let sum2 = 0; // Double
              let sum3 = 0; // Single
              
              const data1 = array.find((element) => element.card === tripleDigit);
              sum1 = data1 ? data1.value * 900 : 0; 

              const data2 = array.find((element) => element.card === doubleDigit);
              sum2 = data2 ? data2.value * 90 : 0; 

              const data3 = array.find((element) => element.card === singleDigit);
              sum3 = data3 ? data3.value * 9 : 0; 

              const totalPayout = sum1 + sum2 + sum3;

              allCards.push(card);
              allPayouts.push(totalPayout);
            }
            return { allCards, allPayouts };
          }

          // 1. Calculate all possible payouts
          let { allCards, allPayouts } = calculateAllPayouts(room.cardsValue1);

          var slot;
          var totalSum = room.totalBetSum;
          let foundSlot = false;
          
          // 2. Handle Zero Total Bet Case
          if (totalSum == 0) {
            console.log("Total bet is zero, picking random card.");
            const randomIndex = Math.floor(Math.random() * allCards.length);
            slot = allCards[randomIndex];
            foundSlot = true;
          }

          // 3. Check for winning card based on payout percentage ranges
          if (!foundSlot) {
            // Start at 20% and decrease by 5% until 0% is reached. Upper limit is always 60% (0.6).
            const minPercentages = [0.2, 0.15, 0.1, 0.05, 0.0]; 
            const maxPercentage = 0.6; // 60% 

            for (let minPercentage of minPercentages) {
              let minPayout = totalSum * minPercentage;
              let maxPayout = totalSum * maxPercentage;
              let currentRangeCards = [];
              
              // Find all cards whose payout is within the current range: minPayout <= Payout <= maxPayout
              for (let i = 0; i < allPayouts.length; i++) {
                if (allPayouts[i] >= minPayout && allPayouts[i] <= maxPayout) {
                  currentRangeCards.push(allCards[i]);
                }
              }

              console.log(`Checking ${minPercentage * 100}% to ${maxPercentage * 100}%: Found ${currentRangeCards.length} candidates.`);

              if (currentRangeCards.length > 0) {
                // Pick a random card from the found range
                const randomIndex = Math.floor(Math.random() * currentRangeCards.length);
                slot = currentRangeCards[randomIndex];
                foundSlot = true;
                break; // Stop checking once a suitable slot is found
              }
            }
          }
          
          // 4. Fallback if no specific condition met (e.g., all payouts > 60% or < 0% of totalBetSum)
          if (!foundSlot) {
            console.log("No card found in the 0%-60% medium range. Selecting globally minimum payout card as fallback.");
            
            const minPayout = Math.min(...allPayouts);
            let minPayoutCards = [];
            
            // Collect all cards that result in the minimum payout
            for (let i = 0; i < allPayouts.length; i++) {
              if (allPayouts[i] === minPayout) {
                minPayoutCards.push(allCards[i]);
              }
            }
            
            // Pick a random card from the minimum payout cards
            const randomIndex = Math.floor(Math.random() * minPayoutCards.length);
            slot = minPayoutCards[randomIndex];
          }

          io.to(roomId).emit("slot", slot);
          console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

          
          // API calls in parallel
          const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
          const requestData1 = {
            win_number: slot.toString(),
            game_name: "tripleChancePrint",
          };

          const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
          const requestData2 = {
            win_number: slot.toString(),
            game_id: room.gameId,
          };

          try {
            // Run both API calls in parallel
            const [response1, response2] = await Promise.all([
              axios.post(apiUrl1, requestData1),
              axios.post(apiUrl2, requestData2),
            ]);

            // Logs for both responses
            console.log(
              "live-data-from-node requestData1",
              requestData1,
              response1.data
            );
            console.log(
              "requestData2 + result-from-node",
              requestData2,
              response2.data
            );

            console.log("Both API calls completed successfully");
          } catch (error) {
            console.error(error, "++++++Error in one of the API calls++++++");
          }
          
        } else if (room.mode == "High") {
          
          // API call for bet data
          const betData = await fetchBetData(roomId, room.gameId);
          if (betData.success) {
            room.totalBetSum = betData.totalBetSum;
            room.cardsValue1 = betData.cardsValue1;
            await room.save();
          }
          
          console.log(room.mode, "396 (Updated High Logic)");
          console.log("+++++++++++setMode is on+++++++++");
          console.log(
            "+++++++++++++++++++High++++++++++++++++++++++++++++++++"
          );
          var room = await tripleChance.findById(roomId);
          function findCardsInRange(arr) {
            var array = arr;
            let final = array.length - 1;
            let initial = array.length - 1000;
            
            var totalSum = room.totalBetSum;
            let finalArray = [];
            let playerSumArray = [];
            for (let i = final; i >= initial; i--) {
              var card = array[i].card;
              let value = array[i].value;
              let tripleDigit = card;
              let doubleDigit = card.slice(1);
              let singleDigit = card.slice(2);

              let sum1 = 0;
              let sum2 = 0;
              let sum3 = 0;
              let data1 = array.find(
                (element) => element.card === tripleDigit
              );
              sum1 = data1.value * 900;
              let data2 = array.find(
                (element) => element.card === doubleDigit
              );
              sum2 = data2.value * 90;
              let data3 = array.find(
                (element) => element.card === singleDigit
              );
              sum3 = data3.value * 9;
              let sum = sum1 + sum2 + sum3;

              finalArray.push(card);
              playerSumArray.push(sum);
            }
            return { finalArray, playerSumArray };
          }
          
          // Usage:
          let result = findCardsInRange(room.cardsValue1);
          let output = result.finalArray;
          console.log(output.length, "kkkk");
          let outputPlayerSumArray = result.playerSumArray;

          //checking if bet==0then random result will be shouwn
          var room = await tripleChance.findById(roomId);
          var totalSum = room.totalBetSum;
          var slot;
          if (totalSum == 0) {
            console.log("sum is zero");
            let RandomIndex = Math.floor(Math.random() * output.length);
            console.log(typeof RandomIndex, "RandomIndex");
            slot = output[RandomIndex];
            console.log(typeof slot, "kkkkk");
          } else if (output.length == 0) {
            console.log("output length is zero");
            let RandomNumber = Math.floor(Math.random() * 800) + 100;
            let stringRandomNumber = RandomNumber.toString();
            console.log(typeof stringRandomNumber, "RandomIndex");
            slot = stringRandomNumber;
          } else {
            let correspondingIndex = [];

            let maxNumber = Math.max(...outputPlayerSumArray);
            for (let element of outputPlayerSumArray) {
              if (element == maxNumber) {
                let index = outputPlayerSumArray.indexOf(element);
                correspondingIndex.push(output[index]);
                outputPlayerSumArray.splice(index, 1);
                output.splice(index, 1);
              }
            }

            console.log(
              correspondingIndex,
              "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu"
            );
            let indexes = Math.floor(
              Math.random() * correspondingIndex.length
            );
            console.log(correspondingIndex[indexes]);
            slot = correspondingIndex[indexes];
          }
          io.to(roomId).emit("slot", slot);
          console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

          // API calls in parallel
          const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
          const requestData1 = {
            win_number: slot.toString(),
            game_name: "tripleChancePrint",
          };

          const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
          const requestData2 = {
            win_number: slot.toString(),
            game_id: room.gameId,
          };

          try {
            // Run both API calls in parallel
            const [response1, response2] = await Promise.all([
              axios.post(apiUrl1, requestData1),
              axios.post(apiUrl2, requestData2),
            ]);

            // Logs for both responses
            console.log(
              "live-data-from-node requestData1",
              requestData1,
              response1.data
            );
            console.log(
              "requestData2 + result-from-node",
              requestData2,
              response2.data
            );

            console.log("Both API calls completed successfully");
          } catch (error) {
            console.error(error, "++++++Error in one of the API calls++++++");
          }
          
        } else if (room.mode == "Low") {
          
          // API call for bet data
          const betData = await fetchBetData(roomId, room.gameId);
          if (betData.success) {
            room.totalBetSum = betData.totalBetSum;
            room.cardsValue1 = betData.cardsValue1;
            await room.save();
          }
          
          console.log("+++++++++++low setMode is on (Updated Custom Logic)+++++++++");
          console.log(
            "+++++++++++++++++++low++++++++++++++++++++++++++++++++"
          );
          room = await tripleChance.findById(roomId);

          console.log(room, 'room data when low mode is on');

          const localTotalSum = room.cardsValue1.reduce((sum, cardData) => {
            return sum + (cardData.value || 0);
          }, 0);
           
          // Now use the locally calculated sum
          var totalSum = localTotalSum;
          console.log(`Calculated Local Total Sum: ${totalSum}`)

          // Function to calculate individual payout components for a card
          function calculateIndividualPayouts(arr, card) {
            const array = arr;
            
            // सुनिश्चित करें कि हम केवल 3-अंकीय कार्ड्स (100-999) के लिए ही कार्ड को स्लाइस कर सकते हैं
            if (card.length !== 3) return { triplePayout: Infinity, doublePayout: Infinity, singlePayout: Infinity };
            
            const tripleDigit = card; // e.g., "971"
            const doubleDigit = card.slice(1); // e.g., "71"
            const singleDigit = card.slice(2); // e.g., "1"

            const data1 = array.find((element) => element.card === tripleDigit);
            const data2 = array.find((element) => element.card === doubleDigit);
            const data3 = array.find((element) => element.card === singleDigit);

            // Payout calculation based on your multipliers (999, 99, 9)
            const triplePayout = data1 ? data1.value * 999 : 0; 
            const doublePayout = data2 ? data2.value * 99 : 0; 
            const singlePayout = data3 ? data3.value * 9 : 0; 
            
            return { triplePayout, doublePayout, singlePayout };
          }

          // 1. Generate all possible 3-digit cards for checking (100 to 999)
          const allCards = [];
          for (let i = 100; i <= 999; i++) {
            allCards.push(i.toString());
          }

          var slot;
          let foundSlot = false;
          
          // 2. Handle Zero Total Bet Case (totalSum should now be correct)
          if (totalSum == 0) {
            console.log("Total bet is zero, picking random.");
            var slot = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
            foundSlot = true;
          }

          // 3. Check for winning card based on individual payout percentage (0% to X%)
          if (!foundSlot) {
            // Check ranges: 30%, 35%, 40%, 45%, 50%
            const checkPercentages = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]; 

            for (let maxPercentage of checkPercentages) {
              let maxPayout = totalSum * maxPercentage;
              let currentRangeCandidates = [];
              
              // Check all possible cards (100 to 999)
              for (const card of allCards) {
                // Triple check
                const { triplePayout, doublePayout, singlePayout } = calculateIndividualPayouts(room.cardsValue1, card);
                
                // RULE: तीनों Payout (Triple, Double, Single) में से कोई भी maxPayout से अधिक नहीं होना चाहिए।
                if (
                  triplePayout <= maxPayout &&
                  doublePayout <= maxPayout &&
                  singlePayout <= maxPayout
                ) {
                  currentRangeCandidates.push(card);
                }
              }

              console.log(`Checking 0% to ${maxPercentage * 100}%: Found ${currentRangeCandidates.length} candidates.`);

              if (currentRangeCandidates.length > 0) {
                // Pick a random card from the found range
                const randomIndex = Math.floor(Math.random() * currentRangeCandidates.length);
                slot = currentRangeCandidates[randomIndex];
                foundSlot = true;
                break; 
              }
            }
          }

          // 4. Fallback if no specific condition met (all payouts > 50% of totalBetSum)
          if (!foundSlot) {
            console.log("No low payout card found up to 50%, selecting globally minimum payout card as fallback.");
            
            // If nothing found, calculate the full payout for all cards and select the minimum
            const allFullPayouts = allCards.map(card => {
              const { triplePayout, doublePayout, singlePayout } = calculateIndividualPayouts(room.cardsValue1, card);
              return triplePayout + doublePayout + singlePayout;
            });
            
            const minPayout = Math.min(...allFullPayouts);
            let minPayoutCards = [];
            
            for (let i = 0; i < allCards.length; i++) {
              if (allFullPayouts[i] === minPayout) {
                minPayoutCards.push(allCards[i]);
              }
            }
            
            const randomIndex = Math.floor(Math.random() * minPayoutCards.length);
            slot = minPayoutCards[randomIndex];
            console.log(slot, "Fallback slot (Min Payout) chosen.");
          }

          io.to(roomId).emit("slot", slot);
          console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
          
          // API calls run in parallel
          const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
          const requestData1 = {
            win_number: slot.toString(),
            game_name: "tripleChancePrint",
          };

          const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
          const requestData2 = {
            win_number: slot.toString(),
            game_id: room.gameId,
          };

          try {
            const [response1, response2] = await Promise.all([
              axios.post(apiUrl1, requestData1),
              axios.post(apiUrl2, requestData2),
            ]);

            console.log("live-data-from-node success", response1.data);
            console.log("result-from-node success", response2.data);
          } catch (error) {
            console.error("++++++Error in one of the API calls++++++", error.message);
          }
          
        } else {
          if (room.mode == "HighMedium") {
            
            // API call for bet data
            const betData = await fetchBetData(roomId, room.gameId);
            if (betData.success) {
              room.totalBetSum = betData.totalBetSum;
              room.cardsValue1 = betData.cardsValue1;
              await room.save();
            }
            
            // mode will be high Medium
            console.log("+++++++++++ setMode is on+++++++++");
            console.log(
              "+++++++++++++++++++High Medium++++++++++++++++++++++++++++++++"
            );
            var room = await tripleChance.findById(roomId);
            function findCardsInRange(arr) {
              var array = arr;
              console.log("++++++++++ghus gya  mai+++++++++++++");
              let final = array.length - 1;
              console.log(final, "+++++final++++++++");
              let initial = array.length - 1000;
              console.log(initial, "+++++++++++++initial++++++++++++++++++");
              // let totalSum = array.reduce((sum, num) => {
              //     return sum + num.value
              // }, 0)

              var totalSum = room.totalBetSum;
              console.log(totalSum, "++++++++++totalSum++++++++++");
              let finalArray = [];
              let playerSumArray = [];
              for (let i = final; i >= initial; i--) {
                var card = array[i].card;
                let value = array[i].value;
                let tripleDigit = card;
                let doubleDigit = card.slice(1);
                let singleDigit = card.slice(2);
                let sum1 = 0;
                let sum2 = 0;
                let sum3 = 0;
                let data1 = array.find(
                  (element) => element.card === tripleDigit
                );
                sum1 = data1.value * 900;
                let data2 = array.find(
                  (element) => element.card === doubleDigit
                );
                sum2 = data2.value * 90;
                let data3 = array.find(
                  (element) => element.card === singleDigit
                );
                sum3 = data3.value * 9;
                let sum = sum1 + sum2 + sum3;
                if (
                  (sum < 1 * totalSum && sum > 0.8 * totalSum) ||
                  (sum > 0.5 * totalSum && sum < 1.1 * totalSum) ||
                  (sum > 0.4 * totalSum && sum < 1.1 * totalSum) ||
                  (sum > 0.0 * totalSum && sum < 1.1 * totalSum) ||
                  (sum > 0.5 * totalSum && sum < 2 * totalSum)
                ) {
                  finalArray.push(card);
                  playerSumArray.push(sum);
                }
              }
              return { finalArray, playerSumArray };
            }
            // Usage:
            let result = findCardsInRange(room.cardsValue1);
            let output = result.finalArray;
            let outputPlayerSumArray = result.playerSumArray;
            console.log(
              outputPlayerSumArray,
              "+++++outplayerSumArray++++++++"
            );
            let filterElement = [];
            let filterElementCorrespondingSlot = [];
            var room = await tripleChance.findById(roomId);
            var totalSum = room.totalBetSum;
            for (let i = 0; i < outputPlayerSumArray.length; i++) {
              if (outputPlayerSumArray[i] < totalSum) {
                filterElement.push(outputPlayerSumArray[i]);
                filterElementCorrespondingSlot.push(i);
              }
            }
            console.log(filterElement, "+++++++++++filterElament++++++++");
            if (filterElement.length > 0) {
              console.log("++++filter wla amai enter kar gaya+++++");
              const randomNumber = Math.floor(
                Math.random() * filterElement.length - 1
              );
              console.log(randomNumber, "ppppppppppp");
              const thirdMax = filterElementCorrespondingSlot[randomNumber];
              console.log(output);
              var slot = output[thirdMax];
              console.log(slot, "kkkkkk");
            } else if (output.length == 0) {
              console.log("output length is zero");
              let RandomNumber = Math.floor(Math.random() * 800) + 100;
              let stringRandomNumber = RandomNumber.toString();
              console.log(typeof stringRandomNumber, "RandomIndex");
              var slot = stringRandomNumber;
              console.log(slot, "LLLLL");
            } else {
              const randomNumber = Math.floor(Math.random() * output.length);
              const slot = output[randomNumber];

              console.log(slot, "MMMMMMMM");
            }
            io.to(roomId).emit("slot", slot);
            console.log(slot);
           
            // API calls in parallel
            const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChancePrint",
            };

            const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
            const requestData2 = {
              win_number: slot.toString(),
              game_id: room.gameId,
            };

            try {
              // Run both API calls in parallel
              const [response1, response2] = await Promise.all([
                axios.post(apiUrl1, requestData1),
                axios.post(apiUrl2, requestData2),
              ]);

              // Logs for both responses
              console.log(
                "live-data-from-node requestData1",
                requestData1,
                response1.data
              );
              console.log(
                "requestData2 + result-from-node",
                requestData2,
                response2.data
              );

              console.log("Both API calls completed successfully");
            } catch (error) {
              console.error(error, "++++++Error in one of the API calls++++++");
            }
          }
        }

        room.cardsValue1 = myData;
        room.totalBetSum = 0;
        room.mode = "Medium";

        await room.save();

        console.log("one round complete");
        await sleep(15000);

        const deleteX = async () => {
          try {
            const response = await axios.post(
              `https://admin.khelojeetogame.com/api/delete-x-entry?game_name=${gameName}`,
              {},
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            return response.data;
          } catch (error) {
            console.error("Error deleting slot:", error.response?.data || error.message);
            return null;
          }
        };

        deleteX().then((data) => {
          if (data) {
            const deletionResult = data.message;
            console.log("++++Deletion response++++:", deletionResult);
          }
        });

        if (room.players.length === 0) {
          room = await tripleChance.deleteOne({ _id: roomId });
        }

        room = await tripleChance.findById(roomId);

      } while (room != null && room.players.length > 0);
      
      // Clean up running game
      runningGames.delete(roomId);
      
    } catch (error) {
      console.log("Error in start event:", error);
      // Clean up on error
      runningGames.delete(roomId);
    }
  });

  socket.on("bet", async (body) => {
    try {
      const data = JSON.parse(body);
      const { roomId, playerId, cardValueSet, start_point, playerBetSum, mode } = data;
      
      // Validate data
      if (!roomId || !playerId) {
        console.log("Invalid bet data received");
        return;
      }
      
      let room = await tripleChance.findById(roomId);
      if (!room) {
        console.log(`Room ${roomId} not found`);
        return;
      }

      console.log(`Bet received - Room: ${roomId}, Player: ${playerId}, BetSum: ${playerBetSum}, Mode: ${mode}`);
      
      // Convert to numbers
      const betAmount = parseInt(playerBetSum) || 0;
      const playerMode = mode || "Low";
      
      // Debug: Check if this is a duplicate call (same bet amount)
      const existingPlayer = room.players.find(p => p.playerId.toString() === playerId.toString());
      if (existingPlayer && existingPlayer.playerBetSum === betAmount && existingPlayer.mode === playerMode) {
        console.log(`Duplicate bet from player ${playerId}, skipping...`);
        return;
      }
      
      // Save player data with mode
      const playerIndex = room.players.findIndex(p => p.playerId.toString() === playerId.toString());
      
      if (playerIndex === -1) {
        // New player
        room.players.push({
          playerId,
          playerBetSum: betAmount,
          mode: playerMode,
          lastBetTime: Date.now()
        });
        console.log(`New player added: ${playerId} with bet: ${betAmount}`);
      } else {
        // Update existing player
        room.players[playerIndex].playerBetSum = betAmount;
        room.players[playerIndex].mode = playerMode;
        room.players[playerIndex].lastBetTime = Date.now();
        console.log(`Player ${playerId} updated. Bet: ${betAmount}`);
      }

      // Update cards and total bet sum only if bet > 0 and cardValueSet has data
      if (betAmount > 0 && cardValueSet && cardValueSet.length > 0) {
        const updateAllCards = (array, cardValueSet) => {
          for (const item of array) {
            const cardValue = cardValueSet.find((card) => card.card === item.card);
            if (cardValue) {
              item.value = item.value + cardValue.value;
            }
          }
        };
        
        updateAllCards(room.cardsValue1, cardValueSet);
        room.totalBetSum += betAmount;
      }

      // Filter out players with 0 bet or inactive players
      const activePlayers = room.players.filter(player => {
        const playerBet = parseInt(player.playerBetSum) || 0;
        return playerBet > 0;
      });
      
      console.log(`Active players count: ${activePlayers.length}`);

      // Mode calculation logic
      if (activePlayers.length === 0) {
        // No active players with bets
        if (room.players.length > 0) {
          // If there are players but no bets, use the first player's mode
          room.mode = room.players[0].mode || "Medium";
          console.log(`No active bets. Using first player mode: ${room.mode}`);
        } else {
          room.mode = "Medium";
          console.log(`No players. Default mode set to: Medium`);
        }
      } else if (activePlayers.length === 1) {
        // Only one player with bet
        room.mode = activePlayers[0].mode || "Low";
        console.log(`Single active player. Mode set to: ${room.mode} from player: ${activePlayers[0].playerId}`);
      } else {
        // Multiple players with bets
        const totalAllPlayerBets = activePlayers.reduce((sum, player) => {
          return sum + (parseInt(player.playerBetSum) || 0);
        }, 0);
        
        console.log(`Total active bets: ${totalAllPlayerBets}`);
        
        // Calculate 80% threshold
        const threshold = totalAllPlayerBets * 0.8;
        
        // Filter players within 80% threshold
        const eligiblePlayers = activePlayers.filter(player => {
          return (parseInt(player.playerBetSum) || 0) <= threshold;
        });
        
        console.log(`Eligible players count: ${eligiblePlayers.length}`);
        
        if (eligiblePlayers.length > 0) {
          // Find player with highest bet among eligible players
          const highestBetPlayer = eligiblePlayers.reduce((prev, current) => {
            const prevBet = parseInt(prev.playerBetSum) || 0;
            const currentBet = parseInt(current.playerBetSum) || 0;
            return prevBet > currentBet ? prev : current;
          });
          
          room.mode = highestBetPlayer.mode || "Low";
          console.log(`Multiple players. Mode set to: ${room.mode} from player: ${highestBetPlayer.playerId}`);
        } else {
          // If no eligible players, use the player with highest bet
          const highestBetPlayer = activePlayers.reduce((prev, current) => {
            const prevBet = parseInt(prev.playerBetSum) || 0;
            const currentBet = parseInt(current.playerBetSum) || 0;
            return prevBet > currentBet ? prev : current;
          });
          room.mode = highestBetPlayer.mode || "Low";
          console.log(`No eligible within 80%. Using highest bet player mode: ${room.mode}`);
        }
      }

      room = await room.save();
      io.to(roomId).emit("playersBetInfo", room.players);
      console.log(`Room saved. Current mode: ${room.mode}`);
      
    } catch (error) {
      console.error("Error in bet event:", error);
    }
  });

  socket.on("clearAll", async () => {
    try {
      await tripleChance.deleteMany({});
      console.log("All rooms cleared");
    } catch (e) {
      console.log("Error clearing rooms:", e);
    }
  });

  socket.on("leave", async (body) => {
    try {
      console.log("+++++++++++++leave room called++++++++++++");
      var roomId = body.roomId;
      var playerId = body.playerId;
      var room = await tripleChance.findById(roomId);
      
      if (!room) {
        console.log(`Room ${roomId} not found`);
        return;
      }
      
      console.log(`Before leave: ${room.players.length} players`);
      
      // Remove player
      room.players = room.players.filter((item) => {
        return item.playerId != playerId;
      });
      
      console.log(`After leave: ${room.players.length} players`);
      
      room = await room.save();
      
      // If no players left, stop the game
      if (room.players.length === 0) {
        console.log(`No players left in room ${roomId}, game will stop after current round`);
      }
      
    } catch (error) {
      console.log("Error in leave event:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      console.log(`Socket disconnected: ${socket.id}`);

      const playerData = await tripleChance.aggregate([
        {
          $match: {
            players: {
              $elemMatch: {
                socketID: socket.id,
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            playerId: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$players",
                    as: "player",
                    cond: { $eq: ["$$player.socketID", socket.id] },
                  },
                },
                0,
              ],
            },
          },
        },
      ]);
      
      let playerId;
      if (playerData.length > 0 && playerData[0].playerId) {
        playerId = playerData[0].playerId.playerId;
        console.log("Player ID found for disconnect:", playerId);

        const logoutApiUrl = `https://admin.khelojeetogame.com/api/logout-from-node?user_id=${Number(playerId)}`;

        try {
          const response = await axios.get(logoutApiUrl);
          console.log("Logout API Response:", response.data);
        } catch (error) {
          console.log("Logout API error:", error.message);
        }
      } else {
        console.log("No player found for socket:", socket.id);
      }
    } catch (error) {
      console.log("Error in disconnect event:", error.message);
    }
  });
});

// Endpoint to clear the database
app.post("/clear-database", async (req, res) => {
  try {
    console.log("Clearing database...");
    await tripleChance.deleteMany({});
    res.status(200).send("Database cleared");
  } catch (error) {
    console.error("Error clearing database:", error.message, error.stack);
    res.status(500).send("Error clearing database");
  }
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});