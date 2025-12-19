
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

// socket.on("start", async (body) => {
//     try {
//       console.log("---------------------------game started----------------------------");
//       let roomId = body.roomId;
//       let gameName = body.gameName || "tripleChancePrint";
//       
//       // Check if game is already running for this room
//       if (runningGames.has(roomId)) {
//         console.log(`Game already running for room ${roomId}, skipping...`);
//         return;
//       }
//       
//       // Mark game as running
//       runningGames.set(roomId, true);
//       
//       var room = await tripleChance.findById(roomId);
//       if (!room) {
//         console.log(`Room ${roomId} not found`);
//         runningGames.delete(roomId);
//         return;
//       }
//       
//       socket.join(roomId);
//       
//       // Set the total round time to 90 seconds
//       const totalRoundTime = 90;
//       // The loop runs for totalRoundTime - 4 seconds (90 - 4 = 86 times)
//       const loopIterations = totalRoundTime - 4; // 86
//       
//       do {
//         var gameId = Math.floor(Date.now() / 1000).toString();
//         // CHANGE 1: draw_time set to totalRoundTime (90 seconds)
//         var draw_time = Math.floor(Date.now() / 1000 + totalRoundTime); // 90 seconds
//         room.draw_time = draw_time;
//         room.gameId = gameId;
//         room = await room.save();
//         io.to(roomId).emit("startBet", true);
//         io.to(roomId).emit("draw_time", room.draw_time);
//         io.to(roomId).emit("gameId", room.gameId);

//         // Define roomJJ variable at the beginning
//         let roomJJ = null;
//         
//         // CHANGE 2: Loop runs for loopIterations (86 times)
//         for (let i = 0; i < loopIterations; i++) {
//           io.to(roomId).emit("timer", totalRoundTime - i); // 90, 89, ..., 5
//           roomJJ = await tripleChance.findById(roomId); // Update roomJJ
//           roomJJ.currentTime = (totalRoundTime - i).toString();
//           roomJJ = await roomJJ.save();
//           await sleep(1000);
//           // CHANGE 3: Check condition at loopIterations - 1 (85)
//           if (i == loopIterations - 1 && gameName == "tripleChancePrint") {
//             console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
//             console.log("Using local bet data instead of API call");
//             console.log("Total Bet Sum:", roomJJ.totalBetSum);
//             console.log("cardValue1" , roomJJ.cardsValue1);
//             console.log("Mode:", roomJJ.mode);

//             io.to(roomId).emit("timer", 4);
//             break;
//           }

//           if (roomJJ === null) {
//             break;
//           }
//         }

//         // Check if roomJJ is defined
//         let modeValue = "none";
//         if (roomJJ) {
//           modeValue = roomJJ.mode || "none";
//         } else {
//           // Fallback to room variable
//           modeValue = room.mode || "none";
//         }
//         
//         console.log(modeValue, "Current mode from database");

//         // io.to(roomId).emit("roomData", room)
//         io.to(roomId).emit("timer", 3);
//         console.log(3);
//         await sleep(1000);
//         io.to(roomId).emit("timer", 2);
//         console.log(2);
//         await sleep(1000);
//         io.to(roomId).emit("timer", 1);
//         console.log(1);
//         await sleep(1000);
//         io.to(roomId).emit("timer", 0);
//         console.log(0);
//         console.log(modeValue, "jjjjj");
//         // Update room with current modeValue
//         room = await tripleChance.findById(roomId);
//         if (!room) {
//           console.log(`Room ${roomId} not found after timer loop`);
//           break;
//         }
//         
//         room.mode = modeValue;
//         console.log(room.mode, "hhhhhhhhhh");
//         room = await room.save();
//         
//         console.log(room.mode, "++++++++++++++mode mil ya +++++++++++++");
//         
//         // DIRECTLY GO TO ELSE PART - REMOVED THE IF CONDITION
//         console.log("else part mai agya hai");
//         
//         // Ensure room object is fresh
//         room = await tripleChance.findById(roomId);
//         if (!room) {
//           console.log(`Room ${roomId} not found for mode calculation`);
//           break;
//         }
//         
//         // Now check the mode
//         if (room.mode == "Medium") {
//           
//           // API call for bet data
//           // const betData = await fetchBetData(roomId, room.gameId);
//           // if (betData.success) {
//           //   room.totalBetSum = betData.totalBetSum;
//           //   room.cardsValue1 = betData.cardsValue1;
//           //   await room.save();
//           // }

//           console.log(room.mode, "309 (Updated Medium Logic)");
//           console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++");
//           
//           // Refresh room data
//           room = await tripleChance.findById(roomId);

//           // Function to calculate all card/payout sums (re-factored for clarity)
//           function calculateAllPayouts(arr) {
//             const array = arr;
//             const final = array.length - 1;
//             const initial = Math.max(0, array.length - 1000); 

//             const allCards = []; 
//             const allPayouts = []; 

//             for (let i = final; i >= initial; i--) {
//               const card = array[i].card;
//               const tripleDigit = card;
//               const doubleDigit = card.slice(1);
//               const singleDigit = card.slice(2);

//               let sum1 = 0; // Triple
//               let sum2 = 0; // Double
//               let sum3 = 0; // Single
//               
//               const data1 = array.find((element) => element.card === tripleDigit);
//               sum1 = data1 ? data1.value * 900 : 0; 

//               const data2 = array.find((element) => element.card === doubleDigit);
//               sum2 = data2 ? data2.value * 90 : 0; 

//               const data3 = array.find((element) => element.card === singleDigit);
//               sum3 = data3 ? data3.value * 9 : 0; 

//               const totalPayout = sum1 + sum2 + sum3;

//               allCards.push(card);
//               allPayouts.push(totalPayout);
//             }
//             return { allCards, allPayouts };
//           }

//           // 1. Calculate all possible payouts
//           let { allCards, allPayouts } = calculateAllPayouts(room.cardsValue1);

//           var slot;
//           var totalSum = room.totalBetSum;
//           let foundSlot = false;
//           
//           // 2. Handle Zero Total Bet Case
//           if (totalSum == 0) {
//             console.log("Total bet is zero, picking random card.");
//             const randomIndex = Math.floor(Math.random() * allCards.length);
//             slot = allCards[randomIndex];
//             foundSlot = true;
//           }

//           // 3. Check for winning card based on payout percentage ranges
//           if (!foundSlot) {
//             // Start at 20% and decrease by 5% until 0% is reached. Upper limit is always 60% (0.6).
//             const minPercentages = [0.2, 0.15, 0.1, 0.05, 0.0]; 
//             const maxPercentage = 0.6; // 60% 

//             for (let minPercentage of minPercentages) {
//               let minPayout = totalSum * minPercentage;
//               let maxPayout = totalSum * maxPercentage;
//               let currentRangeCards = [];
//               
//               // Find all cards whose payout is within the current range: minPayout <= Payout <= maxPayout
//               for (let i = 0; i < allPayouts.length; i++) {
//                 if (allPayouts[i] >= minPayout && allPayouts[i] <= maxPayout) {
//                   currentRangeCards.push(allCards[i]);
//                 }
//               }

//               console.log(`Checking ${minPercentage * 100}% to ${maxPercentage * 100}%: Found ${currentRangeCards.length} candidates.`);

//               if (currentRangeCards.length > 0) {
//                 // Pick a random card from the found range
//                 const randomIndex = Math.floor(Math.random() * currentRangeCards.length);
//                 slot = currentRangeCards[randomIndex];
//                 foundSlot = true;
//                 break; // Stop checking once a suitable slot is found
//               }
//             }
//           }
//           
//           // 4. Fallback if no specific condition met (e.g., all payouts > 60% or < 0% of totalBetSum)
//           if (!foundSlot) {
//             console.log("No card found in the 0%-60% medium range. Selecting globally minimum payout card as fallback.");
//             
//             const minPayout = Math.min(...allPayouts);
//             let minPayoutCards = [];
//             
//             // Collect all cards that result in the minimum payout
//             for (let i = 0; i < allPayouts.length; i++) {
//               if (allPayouts[i] === minPayout) {
//                 minPayoutCards.push(allCards[i]);
//               }
//             }
//             
//             // Pick a random card from the minimum payout cards
//             const randomIndex = Math.floor(Math.random() * minPayoutCards.length);
//             slot = minPayoutCards[randomIndex];
//           }

//           io.to(roomId).emit("slot", slot);
//           console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

//           
//           // API calls in parallel
//           const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
//           const requestData1 = {
//             win_number: slot.toString(),
//             game_name: "tripleChance",
//           };

//           const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
//           const requestData2 = {
//             win_number: slot.toString(),
//             game_id: room.gameId,
//           };

//           try {
//             // Run both API calls in parallel
//             const [response1, response2] = await Promise.all([
//               axios.post(apiUrl1, requestData1),
//               axios.post(apiUrl2, requestData2),
//             ]);

//             // Logs for both responses
//             console.log(
//               "live-data-from-node requestData1",
//               requestData1,
//               response1.data
//             );
//             console.log(
//               "requestData2 + result-from-node",
//               requestData2,
//               response2.data
//             );

//             console.log("Both API calls completed successfully");
//           } catch (error) {
//             console.error(error, "++++++Error in one of the API calls++++++");
//           }
//           
//         } else if (room.mode == "High") {
//           
//           // API call for bet data
//           // const betData = await fetchBetData(roomId, room.gameId);
//           // if (betData.success) {
//           //   room.totalBetSum = betData.totalBetSum;
//           //   room.cardsValue1 = betData.cardsValue1;
//           //   await room.save();
//           // }
//           
//           console.log(room.mode, "396 (Updated High Logic)");
//           console.log("+++++++++++setMode is on+++++++++");
//           console.log(
//             "+++++++++++++++++++High++++++++++++++++++++++++++++++++"
//           );
//           
//           // Refresh room data
//           room = await tripleChance.findById(roomId);
//           
//           function findCardsInRange(arr) {
//             var array = arr;
//             let final = array.length - 1;
//             let initial = array.length - 1000;
//             
//             var totalSum = room.totalBetSum;
//             let finalArray = [];
//             let playerSumArray = [];
//             for (let i = final; i >= initial; i--) {
//               var card = array[i].card;
//               let value = array[i].value;
//               let tripleDigit = card;
//               let doubleDigit = card.slice(1);
//               let singleDigit = card.slice(2);

//               let sum1 = 0;
//               let sum2 = 0;
//               let sum3 = 0;
//               let data1 = array.find(
//                 (element) => element.card === tripleDigit
//               );
//               sum1 = data1.value * 900;
//               let data2 = array.find(
//                 (element) => element.card === doubleDigit
//               );
//               sum2 = data2.value * 90;
//               let data3 = array.find(
//                 (element) => element.card === singleDigit
//               );
//               sum3 = data3.value * 9;
//               let sum = sum1 + sum2 + sum3;

//               finalArray.push(card);
//               playerSumArray.push(sum);
//             }
//             return { finalArray, playerSumArray };
//           }
//           
//           // Usage:
//           let result = findCardsInRange(room.cardsValue1);
//           let output = result.finalArray;
//           console.log(output.length, "kkkk");
//           let outputPlayerSumArray = result.playerSumArray;

//           //checking if bet==0then random result will be shouwn
//           var totalSum = room.totalBetSum;
//           var slot;
//           if (totalSum == 0) {
//             console.log("sum is zero");
//             let RandomIndex = Math.floor(Math.random() * output.length);
//             console.log(typeof RandomIndex, "RandomIndex");
//             slot = output[RandomIndex];
//             console.log(typeof slot, "kkkkk");
//           } else if (output.length == 0) {
//             console.log("output length is zero");
//             let RandomNumber = Math.floor(Math.random() * 800) + 100;
//             let stringRandomNumber = RandomNumber.toString();
//             console.log(typeof stringRandomNumber, "RandomIndex");
//             slot = stringRandomNumber;
//           } else {
//             let correspondingIndex = [];

//             let maxNumber = Math.max(...outputPlayerSumArray);
//             for (let element of outputPlayerSumArray) {
//               if (element == maxNumber) {
//                 let index = outputPlayerSumArray.indexOf(element);
//                 correspondingIndex.push(output[index]);
//                 outputPlayerSumArray.splice(index, 1);
//                 output.splice(index, 1);
//               }
//             }

//             console.log(
//               correspondingIndex,
//               "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu"
//             );
//             let indexes = Math.floor(
//               Math.random() * correspondingIndex.length
//             );
//             console.log(correspondingIndex[indexes]);
//             slot = correspondingIndex[indexes];
//           }
//           io.to(roomId).emit("slot", slot);
//           console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

//           // API calls in parallel
//           const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
//           const requestData1 = {
//             win_number: slot.toString(),
//             game_name: "tripleChance",
//           };

//           const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
//           const requestData2 = {
//             win_number: slot.toString(),
//             game_id: room.gameId,
//           };

//           try {
//             // Run both API calls in parallel
//             const [response1, response2] = await Promise.all([
//               axios.post(apiUrl1, requestData1),
//               axios.post(apiUrl2, requestData2),
//             ]);

//             // Logs for both responses
//             console.log(
//               "live-data-from-node requestData1",
//               requestData1,
//               response1.data
//             );
//             console.log(
//               "requestData2 + result-from-node",
//               requestData2,
//               response2.data
//             );

//             console.log("Both API calls completed successfully");
//           } catch (error) {
//             console.error(error, "++++++Error in one of the API calls++++++");
//           }
//           
//         } else if (room.mode == "Low") {
//           
//           // API call for bet data
//           // const betData = await fetchBetData(roomId, room.gameId);
//           // if (betData.success) {
//           //   room.totalBetSum = betData.totalBetSum;
//           //   room.cardsValue1 = betData.cardsValue1;
//           //   await room.save();
//           // }
//           
//           console.log("+++++++++++low setMode is on (Updated Custom Logic)+++++++++");
//           console.log(
//             "+++++++++++++++++++low++++++++++++++++++++++++++++++++"
//           );
//           
//           // Refresh room data
//           room = await tripleChance.findById(roomId);

//           console.log('room data when low mode is on');

//           const localTotalSum = room.cardsValue1.reduce((sum, cardData) => {
//             return sum + (cardData.value || 0);
//           }, 0);
//            
//           // Now use the locally calculated sum
//           var totalSum = localTotalSum;
//           console.log(`Calculated Local Total Sum: ${totalSum}`)

//           // Function to calculate individual payout components for a card
//           function calculateIndividualPayouts(arr, card) {
//             const array = arr;
//             
//             // सुनिश्चित करें कि हम केवल 3-अंकीय कार्ड्स (100-999) के लिए ही कार्ड को स्लाइस कर सकते हैं
//             if (card.length !== 3) return { triplePayout: Infinity, doublePayout: Infinity, singlePayout: Infinity };
//             
//             const tripleDigit = card; // e.g., "971"
//             const doubleDigit = card.slice(1); // e.g., "71"
//             const singleDigit = card.slice(2); // e.g., "1"

//             const data1 = array.find((element) => element.card === tripleDigit);
//             const data2 = array.find((element) => element.card === doubleDigit);
//             const data3 = array.find((element) => element.card === singleDigit);

//             // Payout calculation based on your multipliers (999, 99, 9)
//             const triplePayout = data1 ? data1.value * 999 : 0; 
//             const doublePayout = data2 ? data2.value * 99 : 0; 
//             const singlePayout = data3 ? data3.value * 9 : 0; 
//             
//             return { triplePayout, doublePayout, singlePayout };
//           }

//           // 1. Generate all possible 3-digit cards for checking (100 to 999)
//           const allCards = [];
//           for (let i = 100; i <= 999; i++) {
//             allCards.push(i.toString());
//           }

//           var slot;
//           let foundSlot = false;
//           
//           // 2. Handle Zero Total Bet Case (totalSum should now be correct)
//           if (totalSum == 0) {
//             console.log("Total bet is zero, picking random.");
//             slot = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
//             foundSlot = true;
//           }

//           // 3. Check for winning card based on individual payout percentage (0% to X%)
//           if (!foundSlot) {
//             // Check ranges: 30%, 35%, 40%, 45%, 50%
//             const checkPercentages = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]; 

//             for (let maxPercentage of checkPercentages) {
//               let maxPayout = totalSum * maxPercentage;
//               let currentRangeCandidates = [];
//               
//               // Check all possible cards (100 to 999)
//               for (const card of allCards) {
//                 // Triple check
//                 const { triplePayout, doublePayout, singlePayout } = calculateIndividualPayouts(room.cardsValue1, card);
//                 
//                 // RULE: तीनों Payout (Triple, Double, Single) में से कोई भी maxPayout से अधिक नहीं होना चाहिए।
//                 if (
//                   triplePayout <= maxPayout &&
//                   doublePayout <= maxPayout &&
//                   singlePayout <= maxPayout
//                 ) {
//                   currentRangeCandidates.push(card);
//                 }
//               }

//               console.log(`Checking 0% to ${maxPercentage * 100}%: Found ${currentRangeCandidates.length} candidates.`);

//               if (currentRangeCandidates.length > 0) {
//                 // Pick a random card from the found range
//                 const randomIndex = Math.floor(Math.random() * currentRangeCandidates.length);
//                 slot = currentRangeCandidates[randomIndex];
//                 foundSlot = true;
//                 break; 
//               }
//             }
//           }

//           // 4. Fallback if no specific condition met (all payouts > 50% of totalBetSum)
//           if (!foundSlot) {
//             console.log("No low payout card found up to 50%, selecting globally minimum payout card as fallback.");
//             
//             // If nothing found, calculate the full payout for all cards and select the minimum
//             const allFullPayouts = allCards.map(card => {
//               const { triplePayout, doublePayout, singlePayout } = calculateIndividualPayouts(room.cardsValue1, card);
//               return triplePayout + doublePayout + singlePayout;
//             });
//             
//             const minPayout = Math.min(...allFullPayouts);
//             let minPayoutCards = [];
//             
//             for (let i = 0; i < allCards.length; i++) {
//               if (allFullPayouts[i] === minPayout) {
//                 minPayoutCards.push(allCards[i]);
//               }
//             }
//             
//             const randomIndex = Math.floor(Math.random() * minPayoutCards.length);
//             slot = minPayoutCards[randomIndex];
//             console.log(slot, "Fallback slot (Min Payout) chosen.");
//           }

//           io.to(roomId).emit("slot", slot);
//           console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//           
//           // API calls run in parallel
//           const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
//           const requestData1 = {
//             win_number: slot.toString(),
//             game_name: "tripleChance",
//           };

//           const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
//           const requestData2 = {
//             win_number: slot.toString(),
//             game_id: room.gameId,
//           };

//           try {
//             const [response1, response2] = await Promise.all([
//               axios.post(apiUrl1, requestData1),
//               axios.post(apiUrl2, requestData2),
//             ]);

//             console.log("live-data-from-node success", response1.data);
//             console.log("result-from-node success", response2.data);
//           } catch (error) {
//             console.error("++++++Error in one of the API calls++++++", error.message);
//           }
//           
//         } else {
//           if (room.mode == "HighMedium") {
//             
//             // API call for bet data
//             const betData = await fetchBetData(roomId, room.gameId);
//             if (betData.success) {
//               room.totalBetSum = betData.totalBetSum;
//               room.cardsValue1 = betData.cardsValue1;
//               await room.save();
//             }
//             
//             // mode will be high Medium
//             console.log("+++++++++++ setMode is on+++++++++");
//             console.log(
//               "+++++++++++++++++++High Medium++++++++++++++++++++++++++++++++"
//             );
//             
//             // Refresh room data
//             room = await tripleChance.findById(roomId);
//             
//             function findCardsInRange(arr) {
//               var array = arr;
//               console.log("++++++++++ghus gya  mai+++++++++++++");
//               let final = array.length - 1;
//               console.log(final, "+++++final++++++++");
//               let initial = array.length - 1000;
//               console.log(initial, "+++++++++++++initial++++++++++++++++++");
//               // let totalSum = array.reduce((sum, num) => {
//               //     return sum + num.value
//               // }, 0)

//               var totalSum = room.totalBetSum;
//               console.log(totalSum, "++++++++++totalSum++++++++++");
//               let finalArray = [];
//               let playerSumArray = [];
//               for (let i = final; i >= initial; i--) {
//                 var card = array[i].card;
//                 let value = array[i].value;
//                 let tripleDigit = card;
//                 let doubleDigit = card.slice(1);
//                 let singleDigit = card.slice(2);
//                 let sum1 = 0;
//                 let sum2 = 0;
//                 let sum3 = 0;
//                 let data1 = array.find(
//                   (element) => element.card === tripleDigit
//                 );
//                 sum1 = data1.value * 900;
//                 let data2 = array.find(
//                   (element) => element.card === doubleDigit
//                 );
//                 sum2 = data2.value * 90;
//                 let data3 = array.find(
//                   (element) => element.card === singleDigit
//                 );
//                 sum3 = data3.value * 9;
//                 let sum = sum1 + sum2 + sum3;
//                 if (
//                   (sum < 1 * totalSum && sum > 0.8 * totalSum) ||
//                   (sum > 0.5 * totalSum && sum < 1.1 * totalSum) ||
//                   (sum > 0.4 * totalSum && sum < 1.1 * totalSum) ||
//                   (sum > 0.0 * totalSum && sum < 1.1 * totalSum) ||
//                   (sum > 0.5 * totalSum && sum < 2 * totalSum)
//                 ) {
//                   finalArray.push(card);
//                   playerSumArray.push(sum);
//                 }
//               }
//               return { finalArray, playerSumArray };
//             }
//             // Usage:
//             let result = findCardsInRange(room.cardsValue1);
//             let output = result.finalArray;
//             let outputPlayerSumArray = result.playerSumArray;
//             console.log(
//               outputPlayerSumArray,
//               "+++++outplayerSumArray++++++++"
//             );
//             let filterElement = [];
//             let filterElementCorrespondingSlot = [];
//             var totalSum = room.totalBetSum;
//             for (let i = 0; i < outputPlayerSumArray.length; i++) {
//               if (outputPlayerSumArray[i] < totalSum) {
//                 filterElement.push(outputPlayerSumArray[i]);
//                 filterElementCorrespondingSlot.push(i);
//               }
//             }
//             console.log(filterElement, "+++++++++++filterElament++++++++");
//             if (filterElement.length > 0) {
//               console.log("++++filter wla amai enter kar gaya+++++");
//               const randomNumber = Math.floor(
//                 Math.random() * filterElement.length - 1
//               );
//               console.log(randomNumber, "ppppppppppp");
//               const thirdMax = filterElementCorrespondingSlot[randomNumber];
//               console.log(output);
//               var slot = output[thirdMax];
//               console.log(slot, "kkkkkk");
//             } else if (output.length == 0) {
//               console.log("output length is zero");
//               let RandomNumber = Math.floor(Math.random() * 800) + 100;
//               let stringRandomNumber = RandomNumber.toString();
//               console.log(typeof stringRandomNumber, "RandomIndex");
//               var slot = stringRandomNumber;
//               console.log(slot, "LLLLL");
//             } else {
//               const randomNumber = Math.floor(Math.random() * output.length);
//               slot = output[randomNumber];
//               console.log(slot, "MMMMMMMM");
//             }
//             io.to(roomId).emit("slot", slot);
//             console.log(slot);
//            
//             // API calls in parallel
//             const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
//             const requestData1 = {
//               win_number: slot.toString(),
//               game_name: "tripleChance",
//             };

//             const apiUrl2 = "https://admin.khelojeetogame.com/api/result-from-node";
//             const requestData2 = {
//               win_number: slot.toString(),
//               game_id: room.gameId,
//             };

//             try {
//               // Run both API calls in parallel
//               const [response1, response2] = await Promise.all([
//                 axios.post(apiUrl1, requestData1),
//                 axios.post(apiUrl2, requestData2),
//               ]);

//               // Logs for both responses
//               console.log(
//                 "live-data-from-node requestData1",
//                 requestData1,
//                 response1.data
//               );
//               console.log(
//                 "requestData2 + result-from-node",
//                 requestData2,
//                 response2.data
//               );

//               console.log("Both API calls completed successfully");
//             } catch (error) {
//               console.error(error, "++++++Error in one of the API calls++++++");
//             }
//           }
//         }

//         // Reset for next round
//         room.cardsValue1 = myData;
//         room.totalBetSum = 0;
//         room.mode = "Medium";

//         await room.save();

//         console.log("one round complete");
//         await sleep(18000);

//         const deleteX = async () => {
//           try {
//             const response = await axios.post(
//               `https://admin.khelojeetogame.com/api/delete-x-entry?game_name=${gameName}`,
//               {},
//               {
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//               }
//             );
//             return response.data;
//           } catch (error) {
//             console.error("Error deleting slot:", error.response?.data || error.message);
//             return null;
//           }
//         };

//         deleteX().then((data) => {
//           if (data) {
//             const deletionResult = data.message;
//             console.log("++++Deletion response++++:", deletionResult);
//           }
//         });

//         if (room.players.length === 0) {
//           room = await tripleChance.deleteOne({ _id: roomId });
//         }

//         room = await tripleChance.findById(roomId);

//       } while (room != null && room.players.length > 0);
//       
//       // Clean up running game
//       if (roomId) {
//         runningGames.delete(roomId);
//       }
//       
//     } catch (error) {
//       console.log("Error in start event:", error);
//       // Clean up on error
//       if (roomId) {
//         runningGames.delete(roomId);
//       }
//     }
//   });

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
      
      // Set the total round time to 90 seconds
      const totalRoundTime = 90;
      // The loop runs for totalRoundTime - 4 seconds (90 - 4 = 86 times)
      const loopIterations = totalRoundTime - 4; // 86
      
      do {
        var gameId = Math.floor(Date.now() / 1000).toString();
        // CHANGE 1: draw_time set to totalRoundTime (90 seconds)
        var draw_time = Math.floor(Date.now() / 1000 + totalRoundTime); // 90 seconds
        room.draw_time = draw_time;
        room.gameId = gameId;
        room = await room.save();
        io.to(roomId).emit("startBet", true);
        io.to(roomId).emit("draw_time", room.draw_time);
        io.to(roomId).emit("gameId", room.gameId);

        // Define roomJJ variable at the beginning
        let roomJJ = null;
        
        // CHANGE 2: Loop runs for loopIterations (86 times)
        for (let i = 0; i < loopIterations; i++) {
          io.to(roomId).emit("timer", totalRoundTime - i); // 90, 89, ..., 5
          roomJJ = await tripleChance.findById(roomId); // Update roomJJ
          roomJJ.currentTime = (totalRoundTime - i).toString();
          roomJJ = await roomJJ.save();
          await sleep(1000);
          // CHANGE 3: Check condition at loopIterations - 1 (85)
          if (i == loopIterations - 1 && gameName == "tripleChancePrint") {
            console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
            console.log("Using local bet data instead of API call");
            console.log("Total Bet Sum:", roomJJ.totalBetSum);
            console.log("cardValue1" , roomJJ.cardsValue1);
            console.log("Mode:", roomJJ.mode);

            io.to(roomId).emit("timer", 4);
            break;
          }

          if (roomJJ === null) {
            break;
          }
        }

        // Check if roomJJ is defined
        let modeValue = "none";
        if (roomJJ) {
          modeValue = roomJJ.mode || "none";
        } else {
          // Fallback to room variable
          modeValue = room.mode || "none";
        }
        
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
        // Update room with current modeValue
        room = await tripleChance.findById(roomId);
        if (!room) {
          console.log(`Room ${roomId} not found after timer loop`);
          break;
        }
        
        room.mode = modeValue;
        console.log(room.mode, "hhhhhhhhhh");
        room = await room.save();
        
        console.log(room.mode, "++++++++++++++mode mil ya +++++++++++++");
        
        // DIRECTLY GO TO ELSE PART - REMOVED THE IF CONDITION
        console.log("else part mai agya hai");
        
        // Ensure room object is fresh
        room = await tripleChance.findById(roomId);
        if (!room) {
          console.log(`Room ${roomId} not found for mode calculation`);
          break;
        }
        
        // Now check the mode
        if (room.mode == "Medium") {
          
          // API call for bet data
          // const betData = await fetchBetData(roomId, room.gameId);
          // if (betData.success) {
          //   room.totalBetSum = betData.totalBetSum;
          //   room.cardsValue1 = betData.cardsValue1;
          //   await room.save();
          // }

          console.log(room.mode, "309 (Updated Medium Logic)");
          console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++");
          
          // Refresh room data
          room = await tripleChance.findById(roomId);

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
          // CHANGED: Medium mode now checks 50% to 90% range
          if (!foundSlot) {
            const minPercentage = 0.5; // 50% lower bound
            const maxPercentage = 0.9; // 90% upper bound (CHANGED from 60% to 90%)
            
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
            }
          }
          
          // 4. Fallback if no specific condition met (e.g., all payouts > 90% or < 50% of totalBetSum)
          if (!foundSlot) {
            console.log(`No card found in the ${0.5*100}%-${0.9*100}% medium range. Selecting globally minimum payout card as fallback.`);
            
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
            game_name: "tripleChance",
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
  
  console.log(room.mode, "396 (Updated High Logic)");
  console.log("+++++++++++setMode is on+++++++++");
  console.log(
    "+++++++++++++++++++High++++++++++++++++++++++++++++++++"
  );
  
  // Refresh room data
  room = await tripleChance.findById(roomId);
  
  var slot;
  var totalSum = room.totalBetSum;
  
  // NEW: Check if we have high mode players data
  if (room.highModePlayers && room.highModePlayers.length > 0) {
    console.log(`Processing High mode for ${room.highModePlayers.length} player(s)`);
    console.log('High mode players data:', room.highModePlayers);
    
    // If multiple high mode players, select one randomly
    let selectedHighPlayer;
    if (room.highModePlayers.length > 1) {
      const randomIndex = Math.floor(Math.random() * room.highModePlayers.length);
      selectedHighPlayer = room.highModePlayers[randomIndex];
      console.log(`Multiple High mode players. Randomly selected player: ${selectedHighPlayer.playerId}`);
    } else {
      selectedHighPlayer = room.highModePlayers[0];
      console.log(`Single High mode player selected: ${selectedHighPlayer.playerId}`);
    }
    
    // Find the card with highest bet value from selected player's cardValueSet
    if (selectedHighPlayer.cardValueSet && selectedHighPlayer.cardValueSet.length > 0) {
      let highestBetCard = selectedHighPlayer.cardValueSet[0];
      let highestValue = selectedHighPlayer.cardValueSet[0].value || 0;
      
      for (const cardData of selectedHighPlayer.cardValueSet) {
        const cardValue = cardData.value || 0;
        if (cardValue > highestValue) {
          highestValue = cardValue;
          highestBetCard = cardData;
        }
      }
      
      console.log(`Highest bet card from player ${selectedHighPlayer.playerId}:`, highestBetCard);
      
      // Process the winning card based on digit length
      const winningCard = highestBetCard.card.toString();
      
      if (winningCard.length === 1) {
        // Single digit - add 2 random digits AT THE FRONT
        const randomTwoDigits = Math.floor(Math.random() * 90 + 10).toString(); // 10-99
        slot = randomTwoDigits + winningCard; // "45" + "3" = "453"
        console.log(`Single digit card "${winningCard}". Converted to: ${slot} (random digits in front)`);
      } else if (winningCard.length === 2) {
        // Double digit - add 1 random digit AT THE FRONT
        const randomDigit = Math.floor(Math.random() * 10).toString(); // 0-9
        slot = randomDigit + winningCard; // "4" + "33" = "433"
        console.log(`Double digit card "${winningCard}". Converted to: ${slot} (random digit in front)`);
      } else if (winningCard.length === 3) {
        // Triple digit - use as is
        slot = winningCard;
        console.log(`Triple digit card used as is: ${slot}`);
      } else {
        // Fallback: generate random 3-digit number
        slot = Math.floor(Math.random() * 900 + 100).toString();
        console.log(`Invalid card length. Using random: ${slot}`);
      }
    } else {
      console.log("No card data for high mode player. Checking room cardsValue1...");
      
      // Fallback: Use room.cardsValue1 to find highest bet
      if (room.cardsValue1 && room.cardsValue1.length > 0) {
        let highestBetCard = room.cardsValue1[0];
        let highestValue = room.cardsValue1[0].value || 0;
        
        for (const cardData of room.cardsValue1) {
          const cardValue = cardData.value || 0;
          if (cardValue > highestValue) {
            highestValue = cardValue;
            highestBetCard = cardData;
          }
        }
        
        const winningCard = highestBetCard.card.toString();
        
        if (winningCard.length === 1) {
          const randomTwoDigits = Math.floor(Math.random() * 90 + 10).toString();
          slot = randomTwoDigits + winningCard;
          console.log(`Fallback: Single digit card "${winningCard}" -> ${slot}`);
        } else if (winningCard.length === 2) {
          const randomDigit = Math.floor(Math.random() * 10).toString();
          slot = randomDigit + winningCard;
          console.log(`Fallback: Double digit card "${winningCard}" -> ${slot}`);
        } else {
          slot = winningCard;
          console.log(`Fallback: Using card "${winningCard}" as is`);
        }
      } else {
        console.log("No card data available. Using random number.");
        slot = Math.floor(Math.random() * 900 + 100).toString();
      }
    }
  } else {
    // OLD LOGIC: Execute if no high mode player data found
    console.log("No high mode player data found. Using original High logic.");
    
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
  }
  
  io.to(roomId).emit("slot", slot);
  console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

  // API calls in parallel
  const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
  const requestData1 = {
    win_number: slot.toString(),
    game_name: "tripleChance",
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
          // const betData = await fetchBetData(roomId, room.gameId);
          // if (betData.success) {
          //   room.totalBetSum = betData.totalBetSum;
          //   room.cardsValue1 = betData.cardsValue1;
          //   await room.save();
          // }
          
          console.log("+++++++++++low setMode is on (Updated Custom Logic)+++++++++");
          console.log(
            "+++++++++++++++++++low++++++++++++++++++++++++++++++++"
          );
          
          // Refresh room data
          room = await tripleChance.findById(roomId);

          console.log('room data when low mode is on');

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
            slot = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
            foundSlot = true;
          }

          // 3. Check for winning card based on individual payout percentage (0% to X%)
          // CHANGED: Low mode now checks 40% to 80% range
          if (!foundSlot) {
            const minPercentage = 0.4; // 40% lower bound (CHANGED from 30% to 40%)
            const maxPercentage = 0.8; // 80% upper bound (CHANGED from 95% to 80%)
            
            let maxPayout = totalSum * maxPercentage;
            let minPayout = totalSum * minPercentage;
            let currentRangeCandidates = [];
            
            // Check all possible cards (100 to 999)
            for (const card of allCards) {
              // Triple check
              const { triplePayout, doublePayout, singlePayout } = calculateIndividualPayouts(room.cardsValue1, card);
              
              // RULE: तीनों Payout (Triple, Double, Single) में से कोई भी minPayout से ज्यादा और maxPayout से कम होना चाहिए
              if (
                triplePayout >= minPayout && triplePayout <= maxPayout &&
                doublePayout >= minPayout && doublePayout <= maxPayout &&
                singlePayout >= minPayout && singlePayout <= maxPayout
              ) {
                currentRangeCandidates.push(card);
              }
            }

            console.log(`Checking ${minPercentage * 100}% to ${maxPercentage * 100}%: Found ${currentRangeCandidates.length} candidates.`);

            if (currentRangeCandidates.length > 0) {
              // Pick a random card from the found range
              const randomIndex = Math.floor(Math.random() * currentRangeCandidates.length);
              slot = currentRangeCandidates[randomIndex];
              foundSlot = true;
            }
          }

          // 4. Fallback if no specific condition met (all payouts > 80% or < 40% of totalBetSum)
          if (!foundSlot) {
            console.log(`No low payout card found in the ${0.4*100}%-${0.8*100}% range, selecting globally minimum payout card as fallback.`);
            
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
            game_name: "tripleChance",
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
            // const betData = await fetchBetData(roomId, room.gameId);
            // if (betData.success) {
            //   room.totalBetSum = betData.totalBetSum;
            //   room.cardsValue1 = betData.cardsValue1;
            //   await room.save();
            // }
            
            // mode will be high Medium
            console.log("+++++++++++ setMode is on+++++++++");
            console.log(
              "+++++++++++++++++++High Medium++++++++++++++++++++++++++++++++"
            );
            
            // Refresh room data
            room = await tripleChance.findById(roomId);
            
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
                // CHANGED: HighMedium mode now checks 90% to 200% range
                if (
                  (sum >= 0.9 * totalSum && sum <= 2.0 * totalSum) // 90% to 200%
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
              slot = output[randomNumber];
              console.log(slot, "MMMMMMMM");
            }
            io.to(roomId).emit("slot", slot);
            console.log(slot);
           
            // API calls in parallel
            const apiUrl1 = "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChance",
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

        // Reset for next round
        room.cardsValue1 = myData;
        room.totalBetSum = 0;
        room.mode = "Medium";

        if (room.highModePlayers) {
  room.highModePlayers = [];
}

        await room.save();

        console.log("one round complete");
        await sleep(18000);

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
      if (roomId) {
        runningGames.delete(roomId);
      }
      
    } catch (error) {
      console.log("Error in start event:", error);
      // Clean up on error
      if (roomId) {
        runningGames.delete(roomId);
      }
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
      console.log(`New player added: ${playerId} with bet: ${betAmount} and mode: ${playerMode}`);
    } else {
      // Update existing player
      room.players[playerIndex].playerBetSum = betAmount;
      room.players[playerIndex].mode = playerMode;
      room.players[playerIndex].lastBetTime = Date.now();
      console.log(`Player ${playerId} updated. Bet: ${betAmount}, Mode: ${playerMode}`);
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

    // NEW LOGIC: Check if any player has High mode
    const highModePlayers = room.players.filter(player => player.mode === "High");
    
    if (highModePlayers.length > 0) {
      // If there are players with High mode, directly set room mode to High
      room.mode = "High";
      
      // IMPORTANT: Store high mode player data in room
      // We need to store cardValueSet from the current bet data
      room.highModePlayers = highModePlayers.map(player => ({
        playerId: player.playerId,
        playerBetSum: player.playerBetSum,
        // Store cardValueSet from current bet data for the specific player
        cardValueSet: (player.playerId.toString() === playerId.toString()) ? cardValueSet : []
      }));
      
      console.log(`High mode detected. ${highModePlayers.length} player(s) with High mode. Room mode set to: High`);
      console.log(`Stored high mode players:`, room.highModePlayers);
      
      // Skip all other calculations
      room = await room.save();
      io.to(roomId).emit("playersBetInfo", room.players);
      console.log(`Room saved with High mode`);
      return;
    }

    // OLD LOGIC: Only execute if no player has High mode
    // Filter out players with 0 bet or inactive players
    const activePlayers = room.players.filter(player => {
      const playerBet = parseInt(player.playerBetSum) || 0;
      return playerBet > 0;
    });
    
    console.log(`Active players count: ${activePlayers.length}`);

    // Mode calculation logic (only if no High mode players)
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