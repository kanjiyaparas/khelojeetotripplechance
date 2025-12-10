// const express = require("express");
// const app = express();
// const dotenv = require("dotenv");
// const axios = require("axios");
// const FormData = require("form-data");
// dotenv.config();
// connectDB = require("./config/db");
// const http = require("http");
// const cors = require("cors");
// app.use(cors());
// const db = connectDB();
// const server = http.createServer(app);
// app.use(express.json());
// var io = require("socket.io")(server);
// const tripleChance = require("./model/room");
// const myData = require("./allData");
// // const cron = require('node-cron');
// async function sleep(timer) {
//   return new Promise((resolve, reject) => {
//     setTimeout(resolve, timer);
//   });
// }
// io.on("connection", (socket) => {
//   console.log(socket.id);
//   // console.log(myData)
//   socket.on("joinRoom", async (body) => {
//     try {
//       let playerId = body.playerId;
//       let name = body.name;
//       let totalCoin = body.totalCoin;
//       let profileImageUrl = body.profileImageUrl;
//       let playerStatus = body.playerStatus;
//       let gameName = body.gameName||"tripleChancePrint";;

//       let all = await tripleChance.find();
//       let roomId = " ";

//       all.every((element) => {
//         if (element.isJoin == true ) {
//           roomId = element._id.toString();
//           return false;
//         }
//         return true;
//       });

//       if (roomId == " ") {
//         //CREATES A NEW ROOM IF NO EMPTY ROOM IS FOUND

//         console.log(`${name}`);

//         let roomJJ = new tripleChance();

//         let player = {
//           socketID: socket.id,
//           playerId: playerId,
//           name: name,
//           playerType: "Real Player",
//           totalCoin: totalCoin,
//           profileImageUrl: profileImageUrl,
//           playerStatus: playerStatus,
//         };

//         roomJJ.players.push(player);
//         roomJJ.gameName = gameName;

//         let roomId = roomJJ._id.toString();

//         socket.join(roomId);

//         socket.emit("createRoomSuccess", roomJJ);
//          roomJJ.isJoin = true
//         roomJJ = await roomJJ.save();
//         io.to(roomId).emit("startGame", true);

//         console.log(roomJJ);
//       } else {
//         //JOINS A ROOM WHICH IS NOT FULL
//         roomJJ = await tripleChance.findById(roomId);

//         if (roomJJ.isJoin) {
//           let player = {
//             socketID: socket.id,
//             playerId: playerId,
//             name: name,
//             playerType: "Real Player",
//             totalCoin: totalCoin,
//             profileImageUrl: profileImageUrl,
//             playerStatus: playerStatus,
//           };

//            let players = roomJJ.players;

//           // Check if player already exists
//           let isExistingPlayer = players.some(
//             (element) => element.playerId == playerId
//           );

//           if (isExistingPlayer) {
//             // Remove existing player
//             players = players.filter((element) => element.playerId != playerId);
//             roomJJ.players = players;
//             await roomJJ.save();
//           }

//           // Add new/updated player
//           roomJJ.players.push(player);

//           socket.join(roomId);

//           roomJJ = await roomJJ.save();

//           io.to(roomId).emit("updatedPlayers", roomJJ.players);
//           socket.emit("updatedPlayer", player);
//           io.to(roomId).emit("updatedRoom", roomJJ);
//           io.to(roomId).emit("roomMessage", `${name} has joined the room.`);
//           io.to(roomId).emit("gameId", roomJJ.gameId);
//           io.to(roomId).emit("drawTime", roomJJ.draw_time);
//         } else {
//           socket.emit(
//             "errorOccured",
//             "Sorry! The Room is full. Please try again."
//           );
//           return;
//         }
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   });
//   socket.on("start", async (body) => {
//     try {
//       console.log(
//         "---------------------------game started----------------------------"
//       );
//       let roomId = body.roomId;
//       let gameName = body.gameName||"tripleChancePrint";
//       var room = await tripleChance.findById(roomId);
//       socket.join(roomId);
//       // let mediumCounter = 0
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
//             console.log(
//               "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
//             );
//             async function sendBetSumRequest() {
//               try {
//                 const formData = new URLSearchParams();
//                 formData.append("GameId", gameId); // No newline character
//                 formData.append("gameName", "tripleChance"); // Added 'game' parameter

//                 const response = await axios.post(
//                   "https://admin.khelojeetogame.com/api/player-bet-sum",
//                   formData,
//                   {
//                     headers: {
//                       "Content-Type": "application/x-www-form-urlencoded",
//                     },
//                   }
//                 );

//                 console.log("API Response:", response.data);
//                 roomJJ.totalBetSum = response.data.totalValueSum;
//                 roomJJ.cardsValue1 = response.data.cardValueSet;
//                 roomJJ = await roomJJ.save();
//                 console.log(roomJJ.totalBetSum, "kkkkkkkkkkkkkkkkkkk");
//               } catch (error) {
//                 console.error(
//                   "API Error:",
//                   error.response ? error.response.data : error.message
//                 );
//               }
//             }
//             sendBetSumRequest();

//             io.to(roomId).emit("timer", 4)
//             break;
//           }

//           if (roomJJ === null) {
//             break;
//           }
//         }


            
//                  let modeValue = "none";
       
//                // Your axios call
//                const getModeCall = async () => {
//                  try {
//                    const response = await axios.get(
//                      "https://admin.khelojeetogame.com/api/winning-hotlist?game_name=triplechance"
//                    );
//                    return response.data;
//                  } catch (error) {
//                    console.error("Error fetching data: ", error);
//                    throw error;
//                  }
//                };
               
//                // Main function
//                const fetchAndSetMode = async () => {
//                  try {
//                    const data = await getModeCall();
                   
//                    if (data?.list?.length > 0) {
//                      modeValue = data.list[0].win_type;
//                      console.log(modeValue, "pppppppppppppp");
               
//                      // Make sure roomJJ is fetched before this point
//                      room.mode = modeValue;
//                      await room.save(); // No reassignment needed
               
//                      console.log("Room updated in database.");
//                    } else {
//                      console.warn("No data found in the list");
//                    }
//                  } catch (error) {
//                    console.error("Error:", error);
//                  }
//                };
               
//                fetchAndSetMode();
               
               
//                  console.log(modeValue,"kkkkkkkkkkkkkkk")
           


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
//         if (
//           modeValue == "none" ||
//           modeValue === "" ||
//           modeValue === " " ||
//           modeValue == "Medium"||
//           modeValue == null
//         ) {
//           if (count == 3) {
//             mode = "HighMedium";
//             count = 0;
//           } else if (count >= 0 && count < 3) {
//             mode = "Medium";
//             count++;
//           }

//           console.log(count, "+++++++count+++++++++++");
//           if (mode == "Medium") {
//             // console.log("+++++++++++no setMode is on+++++++++")
//             // console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
//             var room = await tripleChance.findById(roomId);
//             function findCardsInRange(arr) {
//               var array = arr;
//               // console.log(array, "++++187++++++")
//               let final = array.length - 1;
//               // console.log(final, "+++++final++++++++")
//               let initial = array.length - 1000;
//               // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//               // let totalSum = array.reduce((sum, num) => {
//               //     return sum + num.value
//               // }, 0)

//               var totalSum = room.totalBetSum;
//               // console.log(totalSum, "++++++++++totalSum++++++++++")
//               let finalArray = [];
//               let playerSumArray = [];
//               for (let i = final; i >= initial; i--) {
//                 var card = array[i].card;
//                 let value = array[i].value;
//                 let tripleDigit = card;
//                 let doubleDigit = card.slice(1);
//                 let singleDigit = card.slice(2);
//                 // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

//                 let sum1 = 0,
//                   sum2 = 0,
//                   sum3 = 0;
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
//                 if (sum <= 1 * totalSum && sum > 0 * totalSum) {
//                   finalArray.push(card);
//                   playerSumArray.push(sum);
//                 }
//               }
//               return { finalArray, playerSumArray };
//             }
//             // Usage:
//             // console.log(room.cardsValue1, "+++229+++++")
//             let result = findCardsInRange(room.cardsValue1);
//             let output = result.finalArray;
//             let outputPlayerSumArray = result.playerSumArray;
//             console.log(output);
//             let randomIndex = Math.floor(Math.random() * output.length);
//             if (output.length == 0) {
//               var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
//               console.log(slot);
//               io.to(roomId).emit("slot", slot);
//               console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//             } else {
//               // // const randomBet=loweArray[randomIndex]
//               console.log(randomIndex, "kkkkkk");
//               // const index=output.indexOf(randomBet)
//               if (randomIndex == -1) {
//                 var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
//                 console.log(slot);
//                 io.to(roomId).emit("slot", slot);
//                 console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//               } else {
//                 var slot = output[randomIndex];
//                 io.to(roomId).emit("slot", slot);
//                 console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//               }
//             }

//             //    game_data_insert
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
//           if (modeValue == "HighMedium") {
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
//         } else {
//           console.log("else part mai agya hai");
//           if (modeValue == "Medium") {
//             console.log(modeValue, "309");
//             // console.log("+++++++++++no setMode is on+++++++++")
//             // console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
//             var room = await tripleChance.findById(roomId);
//             function findCardsInRange(arr) {
//               var array = arr;
//               // console.log(array, "++++187++++++")
//               let final = array.length - 1;
//               // console.log(final, "+++++final++++++++")
//               let initial = array.length - 1000;
//               // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//               // let totalSum = array.reduce((sum, num) => {
//               //     return sum + num.value
//               // }, 0)

//               var totalSum = room.totalBetSum;
//               // console.log(totalSum, "++++++++++totalSum++++++++++")
//               let finalArray = [];
//               let playerSumArray = [];
//               for (let i = final; i >= initial; i--) {
//                 var card = array[i].card;
//                 let value = array[i].value;
//                 let tripleDigit = card;
//                 let doubleDigit = card.slice(1);
//                 let singleDigit = card.slice(2);
//                 // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

//                 let sum1 = 0,
//                   sum2 = 0,
//                   sum3 = 0;
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
//                 if (sum <= 1 * totalSum && sum > 0 * totalSum) {
//                   finalArray.push(card);
//                   playerSumArray.push(sum);
//                 }
//               }
//               return { finalArray, playerSumArray };
//             }
//             // Usage:
//             // console.log(room.cardsValue1, "+++229+++++")
//             let result = findCardsInRange(room.cardsValue1);
//             let output = result.finalArray;
//             let = result.playerSumArray;

//             let randomIndex = Math.floor(Math.random() * output.length);
//             // // const randomBet=loweArray[randomIndex]
//             console.log(randomIndex, "kkkkkk");
//             // const index=output.indexOf(randomBet)
//             if (randomIndex == -1 || output.length == 0) {
//               var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
//               console.log(slot);
//               io.to(roomId).emit("slot", slot);
//               console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//             } else {
//               var slot = output[randomIndex];
//               io.to(roomId).emit("slot", slot);
//               console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
//             }

//             //    game_data_insert
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
//           } else if (modeValue == "High") {
//             console.log(modeValue, "396");
//             console.log("+++++++++++setMode is on+++++++++");
//             console.log(
//               "+++++++++++++++++++High++++++++++++++++++++++++++++++++"
//             );
//             var room = await tripleChance.findById(roomId);
//             function findCardsInRange(arr) {
//               var array = arr;
//               // console.log("++++++++++ghus gya  mai+++++++++++++")
//               let final = array.length - 1;
//               // console.log(final, "+++++final++++++++")
//               let initial = array.length - 1000;
//               // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//               // let totalSum = array.reduce((sum, num) => {
//               //     return sum + num.value
//               // }, 0)
//               var totalSum = room.totalBetSum;
//               // console.log(totalSum, "++++++++++totalSum++++++++++")
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

//                 finalArray.push(card);
//                 playerSumArray.push(sum);
//               }
//               return { finalArray, playerSumArray };
//             }
//             // Usage:
//             let result = findCardsInRange(room.cardsValue1);
//             let output = result.finalArray;
//             console.log(output.length, "kkkk");
//             let outputPlayerSumArray = result.playerSumArray;

//             //checking if bet==0then random result will be shouwn
//             var room = await tripleChance.findById(roomId);
//             var totalSum = room.totalBetSum;
//             var slot;
//             if (totalSum == 0) {
//               console.log("sum is zero");
//               let RandomIndex = Math.floor(Math.random() * output.length);
//               console.log(typeof RandomIndex, "RandomIndex");
//               // console.log( RandomIndex )
//               slot = output[RandomIndex];
//               console.log(typeof slot, "kkkkk");
//             } else if (output.length == 0) {
//               console.log("output length is zero");
//               let RandomNumber = Math.floor(Math.random() * 800) + 100;
//               let stringRandomNumber = RandomNumber.toString();
//               console.log(typeof stringRandomNumber, "RandomIndex");
//               slot = stringRandomNumber;
//             } else {
//               let correspondingIndex = [];

//               let maxNumber = Math.max(...outputPlayerSumArray);
//               for (let element of outputPlayerSumArray) {
//                 if (element == maxNumber) {
//                   let index = outputPlayerSumArray.indexOf(element);
//                   correspondingIndex.push(output[index]);
//                   outputPlayerSumArray.splice(index, 1);
//                   output.splice(index, 1);
//                 }
//               }

//               console.log(
//                 correspondingIndex,
//                 "uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu"
//               );
//               let indexes = Math.floor(
//                 Math.random() * correspondingIndex.length
//               );
//               console.log(correspondingIndex[indexes]);
//               slot = correspondingIndex[indexes];
//             }
//             io.to(roomId).emit("slot", slot);
//             console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

//             //    game_data_insert
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
//           } else if (modeValue == "Low") {
//             console.log("+++++++++++low setMode is on+++++++++");
//             console.log(
//               "+++++++++++++++++++low++++++++++++++++++++++++++++++++"
//             );
//             room = await tripleChance.findById(roomId);
//             function findCardsInRange(arr) {
//               var array = arr;
//               // console.log("++++++++++ghus gya  mai+++++++++++++")
//               let final = array.length - 1;
//               // console.log(final, "+++++final++++++++")
//               let initial = array.length - 1000;
//               // console.log(initial, "+++++++++++++initial++++++++++++++++++")
//               let totalSum = array.reduce((sum, num) => {
//                 return sum + num.value;
//               }, 0);

//               // var totalSum=room.totalBetSum
//               // console.log(totalSum, "++++++++++totalSum++++++++++")
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

//                 finalArray.push(card);
//                 playerSumArray.push(sum);
//               }
//               return { finalArray, playerSumArray };
//             }
//             // Usage:
//             let result = findCardsInRange(room.cardsValue1);
//             let output = result.finalArray;
//             let outputPlayerSumArray = result.playerSumArray;
//             // console.log(output, "186666666666")
//             // console.log(outputPlayerSumArray, "17666666666666")

//             const minNumber = Math.min(...outputPlayerSumArray);
//             // console.log("Minimum Number:", minNumber);
//             let indexArray = [];
//             for (let i = 0; i < outputPlayerSumArray.length; i++) {
//               if (outputPlayerSumArray[i] === minNumber) {
//                 indexArray.push(i);
//               }
//             }

//             // console.log("Indices of minimum number:", indexArray);

//             let n = Math.floor(Math.random() * indexArray.length); // Removed -1
//             // console.log("Random index:", n);

//             const randomIndex = indexArray[n];
//             // console.log("Corresponding random index from array1:", randomIndex);

//             const slot = output[randomIndex];
//             // console.log("Corresponding value from output:", slot);

//             io.to(roomId).emit("slot", slot);
//             console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

//             //    game_data_insert
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
//           } else {
//             if (modeValue == "HighMedium") {
//               // mode will be high Medium
//               console.log("+++++++++++ setMode is on+++++++++");
//               console.log(
//                 "+++++++++++++++++++High Medium++++++++++++++++++++++++++++++++"
//               );
//               var room = await tripleChance.findById(roomId);
//               function findCardsInRange(arr) {
//                 var array = arr;
//                 console.log("++++++++++ghus gya  mai+++++++++++++");
//                 let final = array.length - 1;
//                 console.log(final, "+++++final++++++++");
//                 let initial = array.length - 1000;
//                 console.log(initial, "+++++++++++++initial++++++++++++++++++");
//                 // let totalSum = array.reduce((sum, num) => {
//                 //     return sum + num.value
//                 // }, 0)

//                 var totalSum = room.totalBetSum;
//                 console.log(totalSum, "++++++++++totalSum++++++++++");
//                 let finalArray = [];
//                 let playerSumArray = [];
//                 for (let i = final; i >= initial; i--) {
//                   var card = array[i].card;
//                   let value = array[i].value;
//                   let tripleDigit = card;
//                   let doubleDigit = card.slice(1);
//                   let singleDigit = card.slice(2);
//                   // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")
//                   let sum1 = 0;
//                   let sum2 = 0;
//                   let sum3 = 0;
//                   let data1 = array.find(
//                     (element) => element.card === tripleDigit
//                   );
//                   sum1 = data1.value * 900;
//                   // console.log(sum1,"sum111111111111")
//                   let data2 = array.find(
//                     (element) => element.card === doubleDigit
//                   );
//                   sum2 = data2.value * 90;
//                   // console.log(sum2,"sum22222222")
//                   let data3 = array.find(
//                     (element) => element.card === singleDigit
//                   );
//                   sum3 = data3.value * 9;
//                   // console.log(sum3,"sum3333333333")
//                   let sum = sum1 + sum2 + sum3;
//                   // console.log(sum)
//                   if (
//                     (sum < 1 * totalSum && sum > 0.8 * totalSum) ||
//                     (sum > 0.5 * totalSum && sum < 1.1 * totalSum) ||
//                     (sum > 0.4 * totalSum && sum < 1.1 * totalSum) ||
//                     (sum > 0.0 * totalSum && sum < 1.1 * totalSum) ||
//                     (sum > 0.5 * totalSum && sum < 2 * totalSum)
//                   ) {
//                     finalArray.push(card);
//                     playerSumArray.push(sum);
//                   }
//                 }
//                 return { finalArray, playerSumArray };
//               }
//               // Usage:
//               let result = findCardsInRange(room.cardsValue1);
//               let output = result.finalArray;
//               let outputPlayerSumArray = result.playerSumArray;
//               console.log(
//                 outputPlayerSumArray,
//                 "+++++outplayerSumArray++++++++"
//               );
//               let filterElement = [];
//               let filterElementCorrespondingSlot = [];
//               var room = await tripleChance.findById(roomId);
//               var totalSum = room.totalBetSum;
//               for (let i = 0; i < outputPlayerSumArray.length; i++) {
//                 if (outputPlayerSumArray[i] < totalSum) {
//                   filterElement.push(outputPlayerSumArray[i]);
//                   filterElementCorrespondingSlot.push(i);
//                 }
//               }
//               console.log(filterElement, "+++++++++++filterElament++++++++");
//               if (filterElement.length > 0) {
//                 console.log("++++filter wla amai enter kar gaya+++++");
//                 // const sortedArray1 = filterElement.sort((a, b) => a - b);
//                 const randomNumber = Math.floor(
//                   Math.random() * filterElement.length - 1
//                 );
//                 console.log(randomNumber, "ppppppppppp");
//                 const thirdMax = filterElementCorrespondingSlot[randomNumber];
//                 // const thirdMaxIndex = outputPlayerSumArray.indexOf(thirdMax);
//                 console.log(output);
//                 // Step 2: Get the corresponding slot from array2 using the index obtained from array1
//                 var slot = output[thirdMax];
//                 console.log(slot, "kkkkkk");
//               } else if (output.length == 0) {
//                 console.log("output length is zero");
//                 let RandomNumber = Math.floor(Math.random() * 800) + 100;
//                 let stringRandomNumber = RandomNumber.toString();
//                 console.log(typeof stringRandomNumber, "RandomIndex");
//                 var slot = stringRandomNumber;
//                 console.log(slot, "LLLLL");
//               } else {
//                 const randomNumber = Math.floor(Math.random() * output.length);
//                 const slot = output[randomNumber];

//                 console.log(slot, "MMMMMMMM");
//               }
//               io.to(roomId).emit("slot", slot);
//               console.log(slot);
//               // game_data_insert
//               const apiUrl1 =
//                 "https://admin.khelojeetogame.com/api/live-data-from-node";
//               const requestData1 = {
//                 win_number: slot.toString(),
//                 game_name: "tripleChancePrint",
//               };

//               axios
//                 .post(apiUrl1, requestData1)
//                 .then((response) => {
//                   console.log(
//                     response.data,
//                     "+++++++game Data insert data+++++++"
//                   ); // Print the response data
//                 })
//                 .catch((error) => {
//                   console.error(
//                     error,
//                     "++++++data nahi ayya error khaya++++++++"
//                   ); // Print any errors
//                 });
//               // all data of the user

//               const apiUrl2 =
//                 "https://admin.khelojeetogame.com/api/result-from-node";
//               const requestData2 = {
//                 win_number: slot.toString(),
//                 game_id: gameId,
//               };
//               console.log("Request Data:", requestData2);
//               //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
//               axios
//                 .post(apiUrl2, requestData2)
//                 .then((response) => {
//                   console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
//                 })
//                 .catch((error) => {
//                   console.error(
//                     error,
//                     "++++++data nahi ayya error khaya++++++++"
//                   ); // Print any errors
//                 });
//             }
//           }
//         }

//         room.cardsValue1 = myData;
//         room.totalBetSum = 0;
//         room.mode = "Medium";


//         await room.save();

//         console.log("one round complete");
//         await sleep(18000);
      
// const deleteX = async () => {
//   try {
//     const response = await axios.post(
//       `https://admin.khelojeetogame.com/api/delete-x-entry?game_name=${gameName}`,
//       {}, // empty POST body
//       {
//         headers: {
//           "Content-Type": "application/json", // or omit if server doesn t care
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Error deleting slot:", error.response?.data || error.message);
//     return null;
//   }
// };

// deleteX().then((data) => {
//   if (data) {
//     const deletionResult = data.message; // Adjust based on API response structure
//     console.log("++++Deletion response++++:", deletionResult);
//   }
// });
//   if (room.players.length === 0) {
//           room = await tripleChance.deleteOne({ _id: roomId });
//           //console.log(`Room ${roomId} ${roomJJ} deleted tripleChance because it had no players.`);
//         }

// 	        room = await tripleChance.findById(roomId);

//       } while (room != null);
//     } catch (error) {
//       console.log(error);
//     }
//   });
//  socket.on("bet", async (body) => {
//   const data = JSON.parse(body);
//   const { roomId, playerId, cardValueSet, start_point, playerBetSum, mode } = data;
//   let room = await tripleChance.findById(roomId);

//   console.log(playerBetSum, cardValueSet, "++++playerBetSum1139++++++++");
  
//   // Save player data with mode
//   const playerIndex = room.players.findIndex(p => p.playerId === playerId);
//   if (playerIndex === -1) {
//     // New player
//     room.players.push({
//       playerId,
//       playerBetSum: parseInt(playerBetSum) || 0,
//       mode: mode || "Low"
//     });
//   } else {
//     // Update existing player
//     room.players[playerIndex].playerBetSum = parseInt(playerBetSum) || 0;
//     room.players[playerIndex].mode = mode || "Low";
//   }

//   // Update cards and total bet sum
//   const updateAllCards = (array, cardValueSet) => {
//     for (const item of array) {
//       const cardValue = cardValueSet.find((card) => card.card === item.card);
//       if (cardValue) {
//         item.value = item.value + cardValue.value;
//       }
//     }
//   };
  
//   updateAllCards(room.cardsValue1, cardValueSet);
//   room.totalBetSum += parseInt(playerBetSum) || 0;

//   // Check if only one player
//   if (room.players.length === 1) {
//     // If only one player, directly use their mode
//     room.mode = room.players[0].mode || "Low";
//     console.log(`Only one player. Mode set to: ${room.mode} from player: ${room.players[0].playerId}`);
//   } else {
//     // For multiple players, calculate 80% threshold logic
//     // Calculate total of all playerBetSums
//     const totalAllPlayerBets = room.players.reduce((sum, player) => {
//       return sum + (parseInt(player.playerBetSum) || 0);
//     }, 0);
    
//     // Calculate 80% threshold
//     const threshold = totalAllPlayerBets * 0.8;
    
//     // Filter players within 80% threshold
//     const eligiblePlayers = room.players.filter(player => {
//       return (parseInt(player.playerBetSum) || 0) <= threshold;
//     });
    
//     // Find player with highest playerBetSum among eligible players
//     if (eligiblePlayers.length > 0) {
//       const highestBetPlayer = eligiblePlayers.reduce((prev, current) => {
//         return (parseInt(prev.playerBetSum) || 0) > (parseInt(current.playerBetSum) || 0) 
//           ? prev 
//           : current;
//       });
      
//       // Set the mode from highest bet player
//       room.mode = highestBetPlayer.mode || "Low";
//       console.log(`Multiple players. Mode set to: ${room.mode} from player: ${highestBetPlayer.playerId}`);
//     } else if (room.players.length > 0) {
//       // If no eligible players (edge case), use the first player's mode
//       room.mode = room.players[0].mode || "Low";
//       console.log(`No eligible players. Default mode set to: ${room.mode}`);
//     }
//   }

//   room = await room.save();
//   io.to(roomId).emit("playersBetInfo", room.players);
// });
//   socket.on("clearAll", async () => {
//     try {
//       await tripleChance.deleteMany({});
//     } catch (e) {
//       console.log(e);
//     }
//   });
//  // socket.on("leave", async (body) => {
// //   try {
// //     console.log("+++++++++++++leaved room called++++++++++++");
// //     var roomId = body.roomId;
// //     var playerId = body.playerId;
// //     var room = await tripleChance.findById(roomId);
// //     console.log(room.players.length, "hiiiiiiiiiii");
// //     if (room.players.length == 1) {
// //       room.players = room.players.filter((item) => {
// //         return item.playerId != playerId;
// //       });
// //     } else {
// //       room.players = room.players.filter((item) => {
// //         return item.playerId != playerId;
// //       });
// //     }
// //     room = await room.save();
// //   } catch (error) {
// //     console.log(error);
// //   }
// // });



//   socket.on("leave", async (body) => {
//     try {
//       console.log("+++++++++++++leaved room called++++++++++++");
//       var roomId = body.roomId;
//       var playerId = body.playerId;
//       var room = await tripleChance.findById(roomId);
//       console.log(room.players.length, "hiiiiiiiiiii");
//         room.players = room.players.filter((item) => {
//         return item.playerId != playerId;
//       });
//       room= await room.save();
//       room = await room.save();
//     } catch (error) {
//       //console.log(error);
//     }
//   });

//   socket.on("disconnect", async () => {
//     try {
//       console.log(`one socket disconnected:${socket.id}`);

//       const playerData = await tripleChance.aggregate([
//         {
//           $match: {
//             players: {
//               $elemMatch: {
//                 socketID: socket.id,
//               },
//             },
//           },
//         },
//         {
//           $project: {
//             _id: 0,
//             playerId: {
//               $arrayElemAt: [
//                 {
//                   $filter: {
//                     input: "$players",
//                     as: "player",
//                     cond: { $eq: ["$$player.socketID", socket.id] },
//                   },
//                 },
//                 0,
//               ],
//             },
//           },
//         },
//       ]);
//       let playerId
//       if (playerData.length > 0 && playerData[0].playerId) {
//          playerId = playerData[0].playerId.playerId;
//         console.log("Player ID:", playerId);
          
//         console.log(playerId,typeof playerId,Number(playerId),"klkkk")

//       const logoutApiUrl = `https://admin.khelojeetogame.com/api/logout-from-node?user_id=${Number(
//         playerId
//       )}`;

//       const response = await axios.get(logoutApiUrl);

//       console.log("Logout API Response:", response.data);
//     }
//     } catch (error) {
//       console.log(error.message);
//     }
//   });
// });

// // Endpoint to clear the database
// app.post("/clear-database", async (req, res) => {
//   try {
//     console.log("hiiiiiii");
//     await tripleChance.deleteMany({});
//     res.status(200).send("Database cleared");
//   } catch (error) {
//     console.error("Error clearing database:", error.message, error.stack);
//     res.status(500).send("Error clearing database");
//   }
// });

// // Schedule a cron job to clear the database at 3 AM every day
// // cron.schedule('0 3 * * *', async () => {
// //     try {
// //         console.log("Running cron job to clear database at 3 AM");
// //         await tripleChance.deleteMany({});
// //         console.log("Database cleared by cron job");
// //     } catch (error) {
// //         console.error('Error clearing database in cron job:', error.message, error.stack);
// //     }
// // });

// server.listen(process.env.PORT, () => {
//   console.log(`Server is running on port ${process.env.PORT}`);
// });


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
        if (
          modeValue == "none" ||
          modeValue === "" ||
          modeValue === " " ||
          modeValue == "Medium" ||
          modeValue == null
        ) {
          if (count == 3) {
            mode = "HighMedium";
            count = 0;
          } else if (count >= 0 && count < 3) {
            mode = "Medium";
            count++;
          }

          console.log(count, "+++++++count+++++++++++");
          if (mode == "Medium") {
            // console.log("+++++++++++no setMode is on+++++++++")
            // console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
            var room = await tripleChance.findById(roomId);
            function findCardsInRange(arr) {
              var array = arr;
              // console.log(array, "++++187++++++")
              let final = array.length - 1;
              // console.log(final, "+++++final++++++++")
              let initial = array.length - 1000;
              // console.log(initial, "+++++++++++++initial++++++++++++++++++")
              // let totalSum = array.reduce((sum, num) => {
              //     return sum + num.value
              // }, 0)

              var totalSum = room.totalBetSum;
              // console.log(totalSum, "++++++++++totalSum++++++++++")
              let finalArray = [];
              let playerSumArray = [];
              for (let i = final; i >= initial; i--) {
                var card = array[i].card;
                let value = array[i].value;
                let tripleDigit = card;
                let doubleDigit = card.slice(1);
                let singleDigit = card.slice(2);
                // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

                let sum1 = 0,
                  sum2 = 0,
                  sum3 = 0;
                let data1 = array.find(
                  (element) => element.card === tripleDigit
                );
                sum1 = data1.value * 900;
                // console.log(sum1,"sum111111111111")
                let data2 = array.find(
                  (element) => element.card === doubleDigit
                );
                sum2 = data2.value * 90;
                // console.log(sum2,"sum22222222")
                let data3 = array.find(
                  (element) => element.card === singleDigit
                );
                sum3 = data3.value * 9;
                // console.log(sum3,"sum3333333333")
                let sum = sum1 + sum2 + sum3;
                // console.log(sum)
                if (sum <= 1 * totalSum && sum > 0 * totalSum) {
                  finalArray.push(card);
                  playerSumArray.push(sum);
                }
              }
              return { finalArray, playerSumArray };
            }
            // Usage:
            // console.log(room.cardsValue1, "+++229+++++")
            let result = findCardsInRange(room.cardsValue1);
            let output = result.finalArray;
            let outputPlayerSumArray = result.playerSumArray;
            console.log(output);
            let randomIndex = Math.floor(Math.random() * output.length);
            if (output.length == 0) {
              var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
              console.log(slot);
              io.to(roomId).emit("slot", slot);
              console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
            } else {
              // // const randomBet=loweArray[randomIndex]
              console.log(randomIndex, "kkkkkk");
              // const index=output.indexOf(randomBet)
              if (randomIndex == -1) {
                var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
                console.log(slot);
                io.to(roomId).emit("slot", slot);
                console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
              } else {
                var slot = output[randomIndex];
                io.to(roomId).emit("slot", slot);
                console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
              }
            }

            //    game_data_insert
            const apiUrl1 =
              "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChancePrint",
            };

            axios
              .post(apiUrl1, requestData1)
              .then((response) => {
                console.log(
                  response.data,
                  "+++++++game Data insert data+++++++"
                ); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });

            const apiUrl2 =
              "https://admin.khelojeetogame.com/api/result-from-node";
            const requestData2 = {
              win_number: slot.toString(),
              game_id: gameId,
            };
            console.log("Request Data:", requestData2);
            //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
            axios
              .post(apiUrl2, requestData2)
              .then((response) => {
                console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });
          }
          if (modeValue == "HighMedium") {
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
                // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")
                let sum1 = 0;
                let sum2 = 0;
                let sum3 = 0;
                let data1 = array.find(
                  (element) => element.card === tripleDigit
                );
                sum1 = data1.value * 900;
                // console.log(sum1,"sum111111111111")
                let data2 = array.find(
                  (element) => element.card === doubleDigit
                );
                sum2 = data2.value * 90;
                // console.log(sum2,"sum22222222")
                let data3 = array.find(
                  (element) => element.card === singleDigit
                );
                sum3 = data3.value * 9;
                // console.log(sum3,"sum3333333333")
                let sum = sum1 + sum2 + sum3;
                // console.log(sum)
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
            console.log(outputPlayerSumArray, "+++++outplayerSumArray++++++++");
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
              // const sortedArray1 = filterElement.sort((a, b) => a - b);
              const randomNumber = Math.floor(
                Math.random() * filterElement.length - 1
              );
              console.log(randomNumber, "ppppppppppp");
              const thirdMax = filterElementCorrespondingSlot[randomNumber];
              // const thirdMaxIndex = outputPlayerSumArray.indexOf(thirdMax);
              console.log(output);
              // Step 2: Get the corresponding slot from array2 using the index obtained from array1
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
            // game_data_insert
            const apiUrl1 =
              "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChancePrint",
            };

            axios
              .post(apiUrl1, requestData1)
              .then((response) => {
                console.log(
                  response.data,
                  "+++++++game Data insert data+++++++"
                ); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });
            // all data of the user

            const apiUrl2 =
              "https://admin.khelojeetogame.com/api/result-from-node";
            const requestData2 = {
              win_number: slot.toString(),
              game_id: gameId,
            };
            console.log("Request Data:", requestData2);
            //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
            axios
              .post(apiUrl2, requestData2)
              .then((response) => {
                console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });
          }
        } else {
          console.log("else part mai agya hai");
          if (modeValue == "Medium") {
            console.log(modeValue, "309");
            // console.log("+++++++++++no setMode is on+++++++++")
            // console.log("+++++++++++++++++++medium++++++++++++++++++++++++++++++++")
            var room = await tripleChance.findById(roomId);
            function findCardsInRange(arr) {
              var array = arr;
              // console.log(array, "++++187++++++")
              let final = array.length - 1;
              // console.log(final, "+++++final++++++++")
              let initial = array.length - 1000;
              // console.log(initial, "+++++++++++++initial++++++++++++++++++")
              // let totalSum = array.reduce((sum, num) => {
              //     return sum + num.value
              // }, 0)

              var totalSum = room.totalBetSum;
              // console.log(totalSum, "++++++++++totalSum++++++++++")
              let finalArray = [];
              let playerSumArray = [];
              for (let i = final; i >= initial; i--) {
                var card = array[i].card;
                let value = array[i].value;
                let tripleDigit = card;
                let doubleDigit = card.slice(1);
                let singleDigit = card.slice(2);
                // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

                let sum1 = 0,
                  sum2 = 0,
                  sum3 = 0;
                let data1 = array.find(
                  (element) => element.card === tripleDigit
                );
                sum1 = data1.value * 900;
                // console.log(sum1,"sum111111111111")
                let data2 = array.find(
                  (element) => element.card === doubleDigit
                );
                sum2 = data2.value * 90;
                // console.log(sum2,"sum22222222")
                let data3 = array.find(
                  (element) => element.card === singleDigit
                );
                sum3 = data3.value * 9;
                // console.log(sum3,"sum3333333333")
                let sum = sum1 + sum2 + sum3;
                // console.log(sum)
                if (sum <= 1 * totalSum && sum > 0 * totalSum) {
                  finalArray.push(card);
                  playerSumArray.push(sum);
                }
              }
              return { finalArray, playerSumArray };
            }
            // Usage:
            // console.log(room.cardsValue1, "+++229+++++")
            let result = findCardsInRange(room.cardsValue1);
            let output = result.finalArray;
            let = result.playerSumArray;

            let randomIndex = Math.floor(Math.random() * output.length);
            // // const randomBet=loweArray[randomIndex]
            console.log(randomIndex, "kkkkkk");
            // const index=output.indexOf(randomBet)
            if (randomIndex == -1 || output.length == 0) {
              var slot = Math.floor(Math.random() * (900 - 101 + 1)) + 101;
              console.log(slot);
              io.to(roomId).emit("slot", slot);
              console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
            } else {
              var slot = output[randomIndex];
              io.to(roomId).emit("slot", slot);
              console.log(slot, "+++++++++++slottttttttttttttt+++++++++");
            }

            //    game_data_insert
            const apiUrl1 =
              "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChancePrint",
            };

            axios
              .post(apiUrl1, requestData1)
              .then((response) => {
                console.log(
                  response.data,
                  "+++++++game Data insert data+++++++"
                ); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });

            const apiUrl2 =
              "https://admin.khelojeetogame.com/api/result-from-node";
            const requestData2 = {
              win_number: slot.toString(),
              game_id: gameId,
            };
            console.log("Request Data:", requestData2);
            //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
            axios
              .post(apiUrl2, requestData2)
              .then((response) => {
                console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });
          } else if (modeValue == "High") {
            console.log(modeValue, "396");
            console.log("+++++++++++setMode is on+++++++++");
            console.log(
              "+++++++++++++++++++High++++++++++++++++++++++++++++++++"
            );
            var room = await tripleChance.findById(roomId);
            function findCardsInRange(arr) {
              var array = arr;
              // console.log("++++++++++ghus gya  mai+++++++++++++")
              let final = array.length - 1;
              // console.log(final, "+++++final++++++++")
              let initial = array.length - 1000;
              // console.log(initial, "+++++++++++++initial++++++++++++++++++")
              // let totalSum = array.reduce((sum, num) => {
              //     return sum + num.value
              // }, 0)
              var totalSum = room.totalBetSum;
              // console.log(totalSum, "++++++++++totalSum++++++++++")
              let finalArray = [];
              let playerSumArray = [];
              for (let i = final; i >= initial; i--) {
                var card = array[i].card;
                let value = array[i].value;
                let tripleDigit = card;
                let doubleDigit = card.slice(1);
                let singleDigit = card.slice(2);
                // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

                let sum1 = 0;
                let sum2 = 0;
                let sum3 = 0;
                let data1 = array.find(
                  (element) => element.card === tripleDigit
                );
                sum1 = data1.value * 900;
                // console.log(sum1,"sum111111111111")
                let data2 = array.find(
                  (element) => element.card === doubleDigit
                );
                sum2 = data2.value * 90;
                // console.log(sum2,"sum22222222")
                let data3 = array.find(
                  (element) => element.card === singleDigit
                );
                sum3 = data3.value * 9;
                // console.log(sum3,"sum3333333333")
                let sum = sum1 + sum2 + sum3;
                // console.log(sum)

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
              // console.log( RandomIndex )
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

            //    game_data_insert
            const apiUrl1 =
              "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChancePrint",
            };

            axios
              .post(apiUrl1, requestData1)
              .then((response) => {
                console.log(
                  response.data,
                  "+++++++game Data insert data+++++++"
                ); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });

            // all data of the user

            const apiUrl2 =
              "https://admin.khelojeetogame.com/api/result-from-node";
            const requestData2 = {
              win_number: slot.toString(),
              game_id: gameId,
            };
            console.log("Request Data:", requestData2);
            //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
            axios
              .post(apiUrl2, requestData2)
              .then((response) => {
                console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });
          } else if (modeValue == "Low") {
            console.log("+++++++++++low setMode is on+++++++++");
            console.log(
              "+++++++++++++++++++low++++++++++++++++++++++++++++++++"
            );
            room = await tripleChance.findById(roomId);
            function findCardsInRange(arr) {
              var array = arr;
              // console.log("++++++++++ghus gya  mai+++++++++++++")
              let final = array.length - 1;
              // console.log(final, "+++++final++++++++")
              let initial = array.length - 1000;
              // console.log(initial, "+++++++++++++initial++++++++++++++++++")
              let totalSum = array.reduce((sum, num) => {
                return sum + num.value;
              }, 0);

              // var totalSum=room.totalBetSum
              // console.log(totalSum, "++++++++++totalSum++++++++++")
              let finalArray = [];
              let playerSumArray = [];
              for (let i = final; i >= initial; i--) {
                var card = array[i].card;
                let value = array[i].value;
                let tripleDigit = card;
                let doubleDigit = card.slice(1);
                let singleDigit = card.slice(2);
                // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")

                let sum1 = 0;
                let sum2 = 0;
                let sum3 = 0;
                let data1 = array.find(
                  (element) => element.card === tripleDigit
                );
                sum1 = data1.value * 900;
                // console.log(sum1,"sum111111111111")
                let data2 = array.find(
                  (element) => element.card === doubleDigit
                );
                sum2 = data2.value * 90;
                // console.log(sum2,"sum22222222")
                let data3 = array.find(
                  (element) => element.card === singleDigit
                );
                sum3 = data3.value * 9;
                // console.log(sum3,"sum3333333333")
                let sum = sum1 + sum2 + sum3;
                // console.log(sum)

                finalArray.push(card);
                playerSumArray.push(sum);
              }
              return { finalArray, playerSumArray };
            }
            // Usage:
            let result = findCardsInRange(room.cardsValue1);
            let output = result.finalArray;
            let outputPlayerSumArray = result.playerSumArray;
            // console.log(output, "186666666666")
            // console.log(outputPlayerSumArray, "17666666666666")

            const minNumber = Math.min(...outputPlayerSumArray);
            // console.log("Minimum Number:", minNumber);
            let indexArray = [];
            for (let i = 0; i < outputPlayerSumArray.length; i++) {
              if (outputPlayerSumArray[i] === minNumber) {
                indexArray.push(i);
              }
            }

            // console.log("Indices of minimum number:", indexArray);

            let n = Math.floor(Math.random() * indexArray.length); // Removed -1
            // console.log("Random index:", n);

            const randomIndex = indexArray[n];
            // console.log("Corresponding random index from array1:", randomIndex);

            const slot = output[randomIndex];
            // console.log("Corresponding value from output:", slot);

            io.to(roomId).emit("slot", slot);
            console.log(slot, "+++++++++++slottttttttttttttt+++++++++");

            //    game_data_insert
            const apiUrl1 =
              "https://admin.khelojeetogame.com/api/live-data-from-node";
            const requestData1 = {
              win_number: slot.toString(),
              game_name: "tripleChancePrint",
            };

            axios
              .post(apiUrl1, requestData1)
              .then((response) => {
                console.log(
                  response.data,
                  "+++++++game Data insert data+++++++"
                ); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });

            // all data of the user

            const apiUrl2 =
              "https://admin.khelojeetogame.com/api/result-from-node";
            const requestData2 = {
              win_number: slot.toString(),
              game_id: gameId,
            };
            console.log("Request Data:", requestData2);
            //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
            axios
              .post(apiUrl2, requestData2)
              .then((response) => {
                console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
              })
              .catch((error) => {
                console.error(
                  error,
                  "++++++data nahi ayya error khaya++++++++"
                ); // Print any errors
              });
          } else {
            if (modeValue == "HighMedium") {
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
                  // console.log(tripleDigit,doubleDigit,singleDigit,"1633333333333333")
                  let sum1 = 0;
                  let sum2 = 0;
                  let sum3 = 0;
                  let data1 = array.find(
                    (element) => element.card === tripleDigit
                  );
                  sum1 = data1.value * 900;
                  // console.log(sum1,"sum111111111111")
                  let data2 = array.find(
                    (element) => element.card === doubleDigit
                  );
                  sum2 = data2.value * 90;
                  // console.log(sum2,"sum22222222")
                  let data3 = array.find(
                    (element) => element.card === singleDigit
                  );
                  sum3 = data3.value * 9;
                  // console.log(sum3,"sum3333333333")
                  let sum = sum1 + sum2 + sum3;
                  // console.log(sum)
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
                // const sortedArray1 = filterElement.sort((a, b) => a - b);
                const randomNumber = Math.floor(
                  Math.random() * filterElement.length - 1
                );
                console.log(randomNumber, "ppppppppppp");
                const thirdMax = filterElementCorrespondingSlot[randomNumber];
                // const thirdMaxIndex = outputPlayerSumArray.indexOf(thirdMax);
                console.log(output);
                // Step 2: Get the corresponding slot from array2 using the index obtained from array1
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
              // game_data_insert
              const apiUrl1 =
                "https://admin.khelojeetogame.com/api/live-data-from-node";
              const requestData1 = {
                win_number: slot.toString(),
                game_name: "tripleChancePrint",
              };

              axios
                .post(apiUrl1, requestData1)
                .then((response) => {
                  console.log(
                    response.data,
                    "+++++++game Data insert data+++++++"
                  ); // Print the response data
                })
                .catch((error) => {
                  console.error(
                    error,
                    "++++++data nahi ayya error khaya++++++++"
                  ); // Print any errors
                });
              // all data of the user

              const apiUrl2 =
                "https://admin.khelojeetogame.com/api/result-from-node";
              const requestData2 = {
                win_number: slot.toString(),
                game_id: gameId,
              };
              console.log("Request Data:", requestData2);
              //   console.log(room.winPrice, "+++hhhhhhhhhhhhhhhhh+++++++");
              axios
                .post(apiUrl2, requestData2)
                .then((response) => {
                  console.log(response.data, "++++++++data aagyaa++++++"); // Print the response data
                })
                .catch((error) => {
                  console.error(
                    error,
                    "++++++data nahi ayya error khaya++++++++"
                  ); // Print any errors
                });
            }
          }
        }

        room.cardsValue1 = myData;
        room.totalBetSum = 0;
        room.mode = "Medium";

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