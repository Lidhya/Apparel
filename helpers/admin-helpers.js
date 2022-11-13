const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const moment = require('moment');
const objectId = require('mongodb').ObjectId


module.exports = {
  /* -------------------------------------------------------------------------- */
  /*                               user Management                              */
  /* -------------------------------------------------------------------------- */

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
        resolve(users)
      } catch (err) {
        reject(err)
      }
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
        reject(err)
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
        reject(err)
      })
    })
  },

  /* -------------------------------------------------------------------------- */
  /*                            Dashboard Management                            */
  /* -------------------------------------------------------------------------- */

  getReport: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const users = await db.get().collection(collection.USER_COLLECTION).find({ block: { $ne: true } }).toArray()
        const totalOrders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
        const totalSales = await db.get().collection(collection.ORDER_COLLECTION).find({ "delivery_status": { $eq: "Delivered" } }).toArray()
        const categories = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()

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
              "name": { "$first": "$products.name" },
              "categoryId": { "$first": "$products.categoryId" },
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
              top_selling_products: {
                $push: { "_id": "$_id", "sum": "$sum", "name": "$name", "categoryId": "$categoryId" }
              }
            }
          }
        ]).toArray()

        /* -------------------------------------------------------------------------- */
        /*                                most ordered                                */
        /* -------------------------------------------------------------------------- */
        const mostOrderedProducts = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $unwind: '$products'
          },
          {
            $group: {
              "_id": "$products.item",
              "name": { "$first": "$products.name" },
              "categoryId": { "$first": "$products.categoryId" },
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
              most_ordered_products: {
                $push: { "_id": "$_id", "sum": "$sum", "name": "$name", "categoryId": "$categoryId" }
              }
            }
          }
        ]).toArray()

        /* -------------------------------------------------------------------------- */
        /*                               most cancelled                               */
        /* -------------------------------------------------------------------------- */
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
              "name": { "$first": "$products.name" },
              "categoryId": { "$first": "$products.categoryId" },
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
              most_cancelled_products: {
                $push: { "_id": "$_id", "sum": "$sum", "name": "$name", "categoryId": "$categoryId" }
              }
            }
          }
        ]).toArray()

        /* -------------------------------------------------------------------------- */
        /*                                daily orders                                */
        /* -------------------------------------------------------------------------- */
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

        /* -------------------------------------------------------------------------- */
        /*                                weekly orders                               */
        /* -------------------------------------------------------------------------- */
        const weeklyOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              delivery_status: 'Delivered'
            },
          },
          {
            $project: {
              week: { $week: "$ordered_date" },
              totalWeekly: "$total"
            }
          },
          {
            $group: {
              _id: "$week",
              totalWeekly: { $sum: "$totalWeekly" }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ]).toArray();

        /* -------------------------------------------------------------------------- */
        /*                                yearly orders                               */
        /* -------------------------------------------------------------------------- */
        const yearlyOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
            $match: {
              delivery_status: 'Delivered'
            },
          },
          {
            $project: {
              year: { $year: "$ordered_date" },
              totalYearly: "$total"
            }
          },
          {
            $group: {
              _id: "$year",
              totalYearly: { $sum: "$totalYearly" }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ]).toArray();

        /* -------------------------------------------------------------------------- */
        /*                                Calculations                                */
        /* -------------------------------------------------------------------------- */

        let revenue = 0
        let codCount = 0
        let razorCount = 0
        let paypalCount = 0
        let walletCount = 0
        let productsCount = 0
        let avgRevenue = 0
        let revenueData = []
        let date = []
        let date1 = []
        let total1 = []

        let dailySale = 0
        let dailyProductsCount = 0
        let dailyAvgRevenue = 0
        let dailySaleCount = 0
        let dailyPaypalCount = 0
        let dailyCodCount = 0
        let dailyRazorCount = 0
        let dailyWalletCount = 0

        for (let dx in dailyOrders) {
          date1.push(dailyOrders[dx]._id.date)
          total1.push(dailyOrders[dx].totalDaily)
        }

        for (let obj in totalSales) {
          let pros = totalSales[obj].products
          productsCount += pros.length
          revenue += totalSales[obj].total
          totalSales[obj].payment_method === 'COD' ? codCount++ : (totalSales[obj].payment_method === 'Razorpay' ? razorCount++ : (totalSales[obj].payment_method === 'Wallet' ? walletCount++ : paypalCount++))
          date.push(totalSales[obj].date)
          revenueData.push(totalSales[obj].total)
        }

        const catSale = []
        for (let cat in categories) {
          let count = 0
          for (let obj in mostSoldProducts[0]?.top_selling_products) {
            if (mostSoldProducts[0]?.top_selling_products[obj].categoryId.equals(categories[cat]._id)) {
              count++
            } else {
              continue
            }
          }

          let catObj = {
            cat_name: categories[cat].category,
            cat_count: count
          }
          catSale.push(catObj)
        }

        let nowDate = new Date()
        let fDate = moment(nowDate).format('YYYY-MM-DD')
        for (let x in totalSales) {
          if (totalSales[x].date == fDate) {
            let pros = totalSales[x].products
            dailyProductsCount += pros.length
            dailySale += totalSales[x].total
            totalSales[x].payment_method === 'COD' ? dailyCodCount++ : (totalSales[x].payment_method === 'Razorpay' ? dailyRazorCount++ : (totalSales[x].payment_method === 'Wallet' ? dailyWalletCount++ : dailyPaypalCount++))
          }
        }

        dailySaleCount = parseInt(dailyCodCount + dailyRazorCount + dailyPaypalCount + dailyWalletCount)
        dailyAvgRevenue = Math.round(parseFloat(dailySale / dailySaleCount))
        avgRevenue = Math.round(parseFloat(revenue / totalSales.length))
        isNaN(dailyAvgRevenue) ? dailyAvgRevenue = 0 : dailyAvgRevenue
        isNaN(avgRevenue) ? avgRevenue = 0 : avgRevenue

        let details = {
          revenue,
          catSale, codCount,
          razorCount, paypalCount, walletCount,
          productsCount, date, date1, total1,
          mostSoldProducts: mostSoldProducts[0]?.top_selling_products.slice(0, 5),
          mostOrderedProducts: mostOrderedProducts[0]?.most_ordered_products.slice(0, 5),
          mostCancelledProducts: mostCancelledProducts[0]?.most_cancelled_products.slice(0, 5),
          dailySale, dailyProductsCount, dailyCodCount, dailyRazorCount, dailyPaypalCount, dailyWalletCount, dailyAvgRevenue,
          dailySalesCount: dailySaleCount,
          revenueData,
          weeklyOrders, yearlyOrders,
          avgRevenue,
          salesCount: totalSales.length,
          OrderCount: totalOrders.length,
          totalUsers: users.length
        }
        resolve(details)
      } catch (err) {
        reject(err)
      }
    })

  }

}
