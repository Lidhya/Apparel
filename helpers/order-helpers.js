require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const objectId = require('mongodb').ObjectId
const moment = require('moment');
const Razorpay = require('razorpay');

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

module.exports = {

    /* ----------------------------- place an order ----------------------------- */
    placeOrder: (order, products, total, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (total) {
                    const { title, name, address, city, pincode, phone, payment_method } = order
                    let date = new Date()
                    let fDate = moment(date).format('YYYY-MM-DD')
                    let time = moment(date).format('LTS');
                    let status = payment_method === 'COD' ? 'Placed' : 'Pending'
                    if (payment_method === 'Wallet') {
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
                            title: title,
                            name: name,
                            address: address,
                            city: city,
                            pincode: pincode,
                            phone: phone
                        },
                        userId: objectId(order.userId),
                        payment_method: payment_method,
                        products: products,
                        total: total,
                        date: fDate,
                        time: time,
                        ordered_date: date,
                        status: status,
                        delivery_status: 'Pending'
                    }

                    db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                        for (var x in products) {
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
                } else { reject(err) }
            } catch (err) {
                reject(err)
            }
        })
    },

    /* --------------------------- user order details --------------------------- */
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ ordered_date: -1 }).toArray()
                resolve(orders)
            } catch (err) {
                reject(err)
            }
        })
    },

    /* ------------------------- generate Razorpay order ------------------------ */
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            try {
                instance.orders.create({
                    amount: total * 100,
                    currency: "INR",
                    receipt: "" + orderId,
                }, (err, order) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(order)
                    }
                })

            } catch (error) {
                reject(error)
            }
        })
    },

    /* ----------------------------- verify payment ----------------------------- */
    verifyPayment: (data) => {
        return new Promise((resolve, reject) => {
            try {
                const crypto = require('crypto')
                let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
                hmac.update(data['payment[razorpay_order_id]'] + '|' + data['payment[razorpay_payment_id]']);
                hmac = hmac.digest('hex')
                if (hmac == data['payment[razorpay_signature]']) {
                    resolve()
                } else {
                    reject()
                }
            } catch (error) {
                reject(error)
            }
        })

    },

    /* -------------------------- change payment status ------------------------- */
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                    $set: {
                        status: "Placed"
                    }
                }).then((data) => {
                    resolve()
                }).catch((err) => {
                    reject(err)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    /* ---------------------------- all order details --------------------------- */
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({ ordered_date: -1 }).toArray()
                resolve(orders)
            } catch (error) {
                reject(error)
            }
        })
    },

    /* --------------------------- update order details-------------------------- */
    updateOrder: (orderId, updateData) => {
        return new Promise((resolve, reject) => {
            try {
                let query = { _id: objectId(orderId) };
                db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { status: updateData.status } }).then((response) => {
                    resolve(response)
                }).catch((err) => {
                    reject(err)
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    /* --------------------------- update order status -------------------------- */
    updateStatus: (orderId, updateData) => {
        return new Promise((resolve, reject) => {
            try {
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
            } catch (error) {
                reject(error)
            }
        })
    },

    /* ------------------------------ cancel order ------------------------------ */
    cancelOrder: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let query = { _id: objectId(orderId) };
                let order = await db.get().collection(collection.ORDER_COLLECTION).findOne(query)
                const { userId, total, products, payment_method, status } = order
                db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { delivery_status: 'Cancelled' } }).then(async (response) => {
                    for (let x in products) {
                        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ "_id": objectId(products[x].item) },
                            {
                                $inc: { stock: products[x].quantity }
                            })
                    }
                    if (payment_method != 'COD' && status == 'Placed') {
                        await db.get().collection(collection.USER_COLLECTION).updateOne({ "_id": objectId(userId) },
                            {
                                $set: { "wallet.last_added": new Date() },
                                $inc: { "wallet.balance": total }
                            })
                    }
                    resolve(response)
                }).catch((err) => {
                    reject(err)
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}
