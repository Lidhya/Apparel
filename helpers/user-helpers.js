const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
const Promise = require('promise')
const { response } = require('express')
const { resolve, reject } = require('promise')
const objectId = require('mongodb').ObjectId
const moment = require('moment');
const Razorpay = require('razorpay');


var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (userCheck) {
                let err = 'Email address already exist'
                reject(err)
            } else {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.block=false
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve(data)
                })
            }

        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email })
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let response = {}
            if (!admin && user.block === true) {
                let err = "Your account is blocked"
                reject(err)
            } else {
                if (user) {
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            console.log('login success')
                            response.user = user
                            response.status = true
                            resolve(response)

                        } else {
                            var err = 'Incorrect password'
                            reject(err)
                        }
                    })
                } else if (admin) {
                    bcrypt.compare(userData.password, admin.password).then((status) => {
                        if (status) {
                            console.log('login success')
                            response.admin = admin
                            response.status = true
                            resolve(response)

                        } else {
                            var err = 'Incorrect password'
                            reject(err)
                        }
                    })

                } else {
                    var err = 'Invalid email or password'
                    reject(err)
                }
            }
        })
    },

    otpLogin: (phone) => {
        return new Promise(async (resolve, reject) => {
            console.log(phone)
            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: phone })
            let response = {}
            if (userCheck) {
                response.user = userCheck
                response.status = true
                resolve(response)
            } else {
                reject('The number is not registered')
            }

        })
    },

    updateProfile: (details, userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            let emailCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: { $ne: objectId(userId) }, email: details.email })
            bcrypt.compare(details.password, user.password).then((status) => {
                if (status) {
                    console.log(emailCheck)
                    if (emailCheck) {
                        let err = 'Email already registered by someone else'
                        reject(err)
                    } else {
                        db.get().collection(collection.USER_COLLECTION).findOneAndUpdate({ _id: objectId(userId) }, {
                            $set: {
                                fname: details.fname,
                                lname: details.lname,
                                email: details.email,
                                phone: details.phone
                            }
                        }).then(async (status) => {
                            console.log(status.value)
                            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                            resolve(user)
                        }).catch(() => {
                            let err = 'Something went wrong'
                            reject(err)
                        })
                    }
                } else {
                    let err = 'Incorrect password'
                    reject(err)
                }
            })

        })

    },

    addToCart: async (proId, userId, priceData) => {
       var dPrice=parseFloat(priceData.dPrice)
    //    await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
    //     {
    //         $set:{"offer_price":dPrice},
    //     })
        let proData = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
        console.log(proData.name)
        let proObj = {
            item: objectId(proId),
            name: proData.name,
            price:dPrice,
            quantity: 1,
            categoryId:proData.categoryId,
            subtotal:dPrice
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            if (userCart) {

                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {

                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then((data) => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: {
                                products: proObj
                            }
                        }
                    ).then((response) => {
                        resolve(response)
                    })

                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    total_amount:0,
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    deleteCart:(userId)=>{
        return new Promise((resolve,reject)=>{
            
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        subtotal: '$products.subtotal',
                        price: '$products.price',
                        name: '$products.name',
                        categoryId:'$products.categoryId'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        subtotal: 1,
                        price: 1,
                        name: 1,
                        categoryId:1,
                        products: {
                            $arrayElemAt: ['$products', 0]
                        }
                    }
                }
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let:{proList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id','$$proList']
                //                     }
                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            console.log(cartItems)
            resolve(cartItems)
        })

    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity: (details) => {
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        details.subtotal=parseFloat(details.subtotal)

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cartId), 'products.item': objectId(details.proId) },
                    {
                        $set: { 'products.$.subtotal': details.subtotal }
                    }
                )
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cartId) },
                        {
                            $pull: { products: { item: objectId(details.proId) } }
                        }
                    ).then((response) => {
                        //    console.log(response)
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cartId), 'products.item': objectId(details.proId) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }
                    ).then((response) => {
                        resolve({ change: true })
                    })
            }

        })
    },

    removeFromCart: (ids) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(ids.cartId) },
                    {
                        $pull: { products: { item: objectId(ids.proId) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                }).catch((err)=>{
                    reject(err)
                })
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        subtotal: '$products.subtotal'
                    }
                },
                // {
                //     $lookup: {
                //         from: collection.PRODUCT_COLLECTION,
                //         localField: 'item',
                //         foreignField: '_id',
                //         as: 'products'
                //     }
                // },
                // {
                //     $project: {
                //         item: 1,
                //         quantity: 1,
                //         products: {
                //             $arrayElemAt: ['$products', 0]
                //         }
                //     }
                // },
                 {
                    $group: {
                        _id: null,
                        total: {
                            $sum: '$subtotal'
                        }
                    }
                }
            ]).toArray()
            
            if (total[0]) {
               await db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId)},
            {
                $set:{
                    "total_amount":total[0].total,
                }
            })

            db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId)}).then((totalAmount)=>{

                resolve(totalAmount.total_amount)
            })
            } else {
                resolve(0)
            }
        })
    },

    getSubTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        products: {
                            $arrayElemAt: ['$products', 0]
                        }
                    }
                }, {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ['$quantity', '$products.actual_price']
                            }
                        }
                    }
                }
            ]).toArray()
            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }
        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    placeOrder: (order, products, total) => {
        return new Promise(async (resolve, reject) => {
            let date = new Date()
            console.log(order.payment_method );
            let fDate = moment(date).format('YYYY-MM-DD')
            let status = order.payment_method === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                delivery_details: {
                    title: order.title,
                    name:order.name,
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
                status: status,
                delivery_status:'Pending'
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async(response) => {
                   for(var x in products){
                    console.log(products[x].item)
                  await  db.get().collection(collection.PRODUCT_COLLECTION).updateOne({"_id": objectId(products[x].item)},
                    {
                        $inc: { stock : -products[x].quantity }
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
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ date: -1 }).toArray()
            resolve(orders,)
        })
    },


    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            let query = { _id: objectId(orderId) };
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { delivery_status:'Cancelled'} }).then((response) => {
                resolve(response)
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })
    },

    updateAddress: (addressData, userId) => {
        return new Promise(async (resolve, reject) => {
            let addressObj = {
                title: addressData.title,
                address: addressData.address,
                city: addressData.city,
                pincode: addressData.pincode,
                phone: addressData.phone
            }
            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId), addresses: { $elemMatch: { title: addressData.title } } })
            console.log(userCheck)
            if (userCheck) {
                let err = 'Title already exists'
                reject(err)
            } else {

                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $push: {
                        addresses: addressObj
                    }
                }).then(async (response) => {
                    let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                    resolve(user)
                }).catch((err) => {
                    reject()
                })
            }


        })
    },

    updatePassword: (pwdData, userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            bcrypt.compare(pwdData.password, user.password).then(async (status) => {
                if (status) {
                    pwdData.new_password = await bcrypt.hash(pwdData.new_password, 10)
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                        $set: {
                            password: pwdData.new_password
                        }
                    }).then((data) => {
                        resolve(data)
                    })
                } else {
                    let err = 'Incorrect password'
                    reject(err)
                }
            })
        })
    },

    deleteAddress: async (title, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $pull: {
                    addresses: { title: title }
                }
            }).then(async (response) => {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                resolve(user)
            })
        })
    },

    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {

            instance.orders.create({
                amount: total*100,
                currency: "INR",
                receipt: ""+orderId,
                // notes: {
                //     key1: "value3",
                //     key2: "value2"
                // }
            },(err, order)=>{
                if(err){
                    console.log(err)
                    reject(err)
                }else{
                    console.log(order)
                    resolve(order)
                }
            })

        })
    },

    verifyPayment:(data)=>{
        return  new Promise((resolve,reject)=>{
            console.log(data);
            const crypto=require('crypto')
            let hmac=crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            hmac.update(data['payment[razorpay_order_id]']+'|'+data['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            console.log(hmac +'\n'+data['payment[razorpay_signature]']);
            if(hmac==data['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })

    },

    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: {
                    status: "Placed"
                }
        }).then(()=>{
            resolve()
        }).catch((err)=>{
            console.log(err)
            reject(err)
        })

    })

}

}