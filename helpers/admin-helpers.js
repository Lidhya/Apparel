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
            const totalOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            const totalSales = await db.get().collection(collection.ORDER_COLLECTION).find({ "delivery_status": { $eq: "Delivered" }}).toArray()
            const categories=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            const mostSoldProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        "delivery_status": { $eq: "Delivered" }
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $group: {
                      "_id": "$products.item",
                      "name":{"$first":"$products.name"},
                      "categoryId":{"$first":"$products.categoryId"},
                      "sum": {
                        "$sum": "$products.quantity"
                      }
                    }
                  },
                  {
                    "$sort": {
                      sum: -1
                    }
                  },
                  {
                    "$group": {
                      _id: null,
                      top_selling_products : {
                        $push: {"_id":"$_id","sum":"$sum", "name":"$name", "categoryId":"$categoryId"}
                      }
                    }
                  }
            ]).toArray()
            
        //-----------------------------------most ordered---------------------------------------------------------//
        const mostOrderedProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $unwind: '$products'
            },
            {
                $group: {
                  "_id": "$products.item",
                  "name":{"$first":"$products.name"},
                  "categoryId":{"$first":"$products.categoryId"},
                  "sum": {
                    "$sum": "$products.quantity"
                  }
                }
              },
              {
                "$sort": {
                  sum: -1
                }
              },
              {
                "$group": {
                  _id: null,
                  most_ordered_products : {
                    $push: {"_id":"$_id","sum":"$sum", "name":"$name", "categoryId":"$categoryId"}
                  }
                }
              }
        ]).toArray()
        //------------------------------------most cancelled--------------------------------------------------------//

        const mostCancelledProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: {
                    "delivery_status": { $eq: "Cancelled" }
                }
            },
            {
                $unwind: '$products'
            },
            {
                $group: {
                  "_id": "$products.item",
                  "name":{"$first":"$products.name"},
                  "categoryId":{"$first":"$products.categoryId"},
                  "sum": {
                    "$sum": "$products.quantity"
                  }
                }
              },
              {
                "$sort": {
                  sum: -1
                }
              },
              {
                "$group": {
                  _id: null,
                  most_cancelled_products : {
                    $push: {"_id":"$_id","sum":"$sum", "name":"$name", "categoryId":"$categoryId"}
                  }
                }
              }
        ]).toArray()
        //-------------------------------------daily orders-------------------------------------------------------//
            const dailyOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        delivery_status: 'Delivered'
                    },
                },
                {

                    $group: {
                        _id: { date: '$date' },
                        totalDaily: { $sum: "$total" }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        totalDaily: 1
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray();
    
            let revenue = 0
            let codCount = 0
            let razorCount = 0
            let paypalCount = 0
            let productsCount = 0
            let revenueData = []
            let date = []
            let date1 = []
            let total1 = []
            let dailySale = 0

            let dailyProductsCount = 0
            let dailyAvgRevenue=0
            let  dailySaleCount=0
            let dailyPaypalCount = 0
            let dailyCodCount = 0
            let dailyRazorCount = 0

            for (let dx in dailyOrders) {
                date1.push(dailyOrders[dx]._id.date)
                total1.push(dailyOrders[dx].totalDaily)
            }
            console.log(date1 + "\n" + total1)

            for (let obj in totalSales) {
                let pros = totalSales[obj].products
                productsCount += pros.length
                revenue += totalSales[obj].total
                totalSales[obj].payment_method === 'COD' ? codCount++ : (totalSales[obj].payment_method === 'Razorpay' ? razorCount++ : paypalCount++)
                date.push(totalSales[obj].date)
                revenueData.push(totalSales[obj].total)
            }

            const catSale=[]
            for(let cat in categories){
                let count=0
                for(let obj in mostSoldProducts[0].top_selling_products){
                    console.log(mostSoldProducts[0].top_selling_products[obj].categoryId+'       huuhuhu        '+categories[cat]._id);
                    if(mostSoldProducts[0].top_selling_products[obj].categoryId.equals(categories[cat]._id) ){
                        console.log('if ill keri');
                        count++
                    }else{
                        continue
                    }
                }
                let catObj={
                    cat_name:categories[cat].category,
                    cat_count:count
                }
                catSale.push(catObj)
            }
            console.log(catSale);

            let nowDate = new Date()
            let fDate = moment(nowDate).format('YYYY-MM-DD')
            for (let x in totalSales) {
                if (totalSales[x].date == fDate) {
                    let pros = totalSales[x].products
                    dailyProductsCount += pros.length
                    dailySale += totalSales[x].total
                    totalSales[x].payment_method === 'COD' ? dailyCodCount++ : (totalSales[x].payment_method === 'Razorpay' ? dailyRazorCount++ : dailyPaypalCount++)
                }
            }
             dailySaleCount = parseInt(dailyCodCount + dailyRazorCount + dailyPaypalCount)
             dailyAvgRevenue = parseFloat(dailySale / dailySaleCount)

            let details = {
                revenue,
                codCount,
                catSale,
                razorCount,
                paypalCount,
                productsCount,
                date,
                date1, total1,
                mostSoldProducts:mostSoldProducts[0].top_selling_products.slice(0,5),
                mostOrderedProducts:mostOrderedProducts[0].most_ordered_products .slice(0,5),
                mostCancelledProducts:mostCancelledProducts[0].most_cancelled_products.slice(0,5),
                dailySale, dailyProductsCount, dailyCodCount, dailyRazorCount, dailyPaypalCount,
                dailyAvgRevenue,
                dailySalesCount: dailySaleCount,
                revenueData,
                avgRevenue: revenue / totalSales.length,
                salesCount: totalSales.length,
                OrderCount: totalOrders.length,
                totalUsers: users.length
            }

            console.log(details)
            resolve(details)
        })
    }
}
