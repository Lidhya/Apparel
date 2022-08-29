const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
const Promise = require('promise')
const { resolve, reject } = require('promise')
const moment = require('moment');
const objectId = require('mongodb').ObjectId

module.exports = {

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            console.log(objectId(userId))
            let query = { _id: objectId(userId) };
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate(query, { $set: { block: true } }).then((response) => {
                console.log(response)
                resolve(response)
            }).catch((err) => {
                console.log(err)
            })
        })
    },

    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            console.log(objectId(userId))
            let query = { _id: objectId(userId) };
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate(query, { $set: { block: false } }).then((response) => {
                console.log(response)
                resolve(response)
            }).catch((err) => {
                console.log(err)
            })
        })
    },

    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            // console.log(orders)
            resolve(orders)
        })
    },
    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            let query = { _id: objectId(orderId) };
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { delivery_status: 'Cancelled' } }).then((response) => {
                resolve(response)
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    },

    updateOrder: (orderId, updateData) => {
        return new Promise((resolve, reject) => {
            let query = { _id: objectId(orderId) };
            let status = updateData.status
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { status: status } }).then((response) => {
                resolve(response)
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    },

    updateStatus: (orderId, updateData) => {
        return new Promise((resolve, reject) => {
            let query = { _id: objectId(orderId) };
            let status = updateData.status
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, {
                $set: {
                    delivery_status: status
                }
            }).then((response) => {
                resolve(response)
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    },

    getReport: () => {
        return new Promise(async (resolve, reject) => {
            const users = await db.get().collection(collection.USER_COLLECTION).find({ block: { $ne: true } }).toArray()
            const totalSales = await db.get().collection(collection.ORDER_COLLECTION).find({ delivery_status: { $eq: 'Delivered' } }).toArray()
            const totalOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            const dailyOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        delivery_status: 'Delivered'  
                   },
                },
                {
                   
                    $group: {
                        _id: {date:'$date'},
                        totalDaily:{$sum:"$total"}
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalDaily:1
                    }
                }
            ]).toArray();
            console.log(dailyOrders)
           
            let revenue=0
            let codCount=0
            let razorCount=0
            let paypalCount=0
            let productsCount=0
            let revenueData=[]
            let date=[]
            let date1=[]
            let total1=[]
            let  dailySale=0
           
            let  dailyProductsCount=0
            let dailyPaypalCount=0
            let dailyCodCount=0
            let dailyRazorCount=0


            for(let dx in dailyOrders){
                date1.push(dailyOrders[dx]._id.date)
                total1.push(dailyOrders[dx].totalDaily)
             }
 console.log(date1+"\n"+total1)
         
            for(let obj in totalSales){
               let pros=totalSales[obj].products
               productsCount+=pros.length
               revenue+=totalSales[obj].total
               totalSales[obj].payment_method=='COD'? codCount++:( totalSales[obj].payment_method=='Razorpay'?razorCount++:paypalCount++)
               date.push(totalSales[obj].date)
               revenueData.push(totalSales[obj].total)
            }

            let nowDate = new Date()
            let fDate = moment(nowDate ).format('YYYY-MM-DD')
            for(let x in totalSales){
                if(totalSales[x].date == fDate){
                    let pros=totalSales[x].products
                    dailyProductsCount+=pros.length
                    dailySale+=totalSales[x].total
                    totalSales[x].payment_method=='COD'? dailyCodCount++:( totalSales[x].payment_method=='Razorpay'? dailyRazorCount++: dailyPaypalCount++)
                }
            }       
            console.log(dailySale,dailyProductsCount,dailyCodCount,dailyRazorCount,dailyPaypalCount)
            let  dailySaleCount=parseInt(dailyCodCount+dailyRazorCount+dailyPaypalCount)
            let  dailyAvgRevenue=parseFloat(dailySale/dailySaleCount)

            let details = {
                revenue: revenue,
                codCount,
                razorCount,
                paypalCount,
                productsCount,
                date,
                date1,total1,
                dailySale,dailyProductsCount,dailyCodCount,dailyRazorCount,dailyPaypalCount,
                dailyAvgRevenue,
                dailySalesCount: dailySaleCount,
                revenueData,
                avgRevenue: revenue/totalSales.length,
                salesCount: totalSales.length,
                OrderCount:totalOrders.length,
                totalUsers: users.length
            }
            
            console.log( date+'\n'+
                revenueData)
                console.log(details)
            resolve(details)
        })
    }
}
