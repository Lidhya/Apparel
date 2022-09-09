const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
const Promise = require('promise')
const objectId = require('mongodb').ObjectId
const moment = require('moment');
const Razorpay = require('razorpay');


module.exports = {

    placeOrder: (order, products, total, userId) => {
        return new Promise(async (resolve, reject) => {
            let date = new Date()
            console.log(order.payment_method);
            let fDate = moment(date).format('YYYY-MM-DD')
            let time = moment(date).format('LTS');
            let status = order.payment_method === 'COD' ? 'Placed' : 'Pending'
            if (order.payment_method === 'Wallet') {
                db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then(async (userData) => {
                    if (userData.wallet.balance < total) {
                        let err = 'Insufficient balance'
                        reject(err)
                    } else {
                        await db.get().collection(collection.USER_COLLECTION).findOneAndUpdate({ _id: objectId(userId) }, {
                            $set: { "wallet.last_added": new Date() },
                            $inc: {
                                "wallet.balance": -total
                            }
                        })
                    }
                })
            }
            let orderObj = {
                delivery_details: {
                    title: order.title,
                    name: order.name,
                    address: order.address,
                    city: order.city,
                    pincode: order.pincode,
                    phone: order.phone
                },
                userId: objectId(order.userId),
                payment_method: order.payment_method,
                products: products,
                total: total,
                date: fDate,
                time: time,
                ordered_date: new Date(),
                status: status,
                delivery_status: 'Pending'
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                for (var x in products) {
                    console.log(products[x].item)
                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ "_id": objectId(products[x].item) },
                        {
                            $inc: { stock: -products[x].quantity }
                        })
                }
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response.insertedId)
            }).catch((err) => {
                reject(err)
            })
        })
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ ordered_date: -1 }).toArray()
            resolve(orders)
        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {

            instance.orders.create({
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId,
            }, (err, order) => {
                if (err) {
                    console.log(err)
                    reject(err)
                } else {
                    console.log(order)
                    resolve(order)
                }
            })

        })
    },

    verifyPayment: (data) => {
        return new Promise((resolve, reject) => {
            console.log(data);
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            hmac.update(data['payment[razorpay_order_id]'] + '|' + data['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            console.log(hmac + '\n' + data['payment[razorpay_signature]']);
            if (hmac == data['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })

    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: "Placed"
                }
            }).then(() => {
                resolve()
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    },

    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
          let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ ordered_date: -1 }).toArray()
          // console.log(orders)
          resolve(orders)
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

    cancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let query = { _id: objectId(orderId) };
            let order = await db.get().collection(collection.ORDER_COLLECTION).find(query).toArray()
            let userId = order[0].userId
            let total = order[0].total
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { delivery_status: 'Cancelled' } }).then(async (response) => {
                for (let x in order[0].products) {
                    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ "_id": objectId(order[0].products[x].item) },
                        {
                            $inc: { stock: order[0].products[x].quantity }
                        })
                }
                if (order[0].payment_method != 'COD' && order[0].status == 'Placed') {
                    await db.get().collection(collection.USER_COLLECTION).updateOne({ "_id": objectId(userId) },
                        {
                            $set: { "wallet.last_added": new Date() },
                            $inc: { "wallet.balance": total }
                        })
                }
                resolve(response)
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    }
}
