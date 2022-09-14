require('dotenv').config()
const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
const Promise = require('promise')
const objectId = require('mongodb').ObjectId
const referralCode = require('referral-codes')

module.exports = {

    /* -------------------------------------------------------------------------- */
    /*                             User Authentication                            */
    /* -------------------------------------------------------------------------- */

    /* ------------------------------- User signup ------------------------------ */

    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.referralId = referralCode.generate(8)[0];
            userData.referred_count = 0
            userData.signUp_date = new Date()
            userData.wallet = {
                balance: 0,
                last_added: new Date()
            }
            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (userCheck) {
                let err = 'Email address already exist'
                reject(err)
            } else {
                if (userData.referrerId) {
                    let referrerCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ referralId: userData.referrerId })
                    let referralOffers = await db.get().collection(collection.REFERRAL_COLLECTION).find().toArray()
                    let referrer_offer = referralOffers[0].referrer_offer
                    let referee_offer = referralOffers[0].referee_offer
                    if (referrerCheck) {
                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(referrerCheck._id) }, {
                            $set: { "wallet.last_added": new Date() },
                            $inc: {
                                "referred_count": 1,
                                "wallet.balance": referrer_offer
                            }
                        })
                        userData.wallet.balance = referee_offer
                        userData.password = await bcrypt.hash(userData.password, 10)
                        userData.block = false
                        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                            resolve(data)
                        })
                    } else {
                        let err = 'Invalid referral code'
                        reject(err)
                    }
                } else {
                    userData.password = await bcrypt.hash(userData.password, 10)
                    userData.block = false
                    db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                        resolve(data)
                    })
                }
            }

        })
    },

   /* ----------------------------- User and admin login ----------------------------- */

    doLogin: (userData) => {       
        return new Promise(async (resolve, reject) => {
           // let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email })   <------if stored in database
           let admin=false
           if(process.env.ADMIN_EMAIL==userData.email){
                admin={
                email:process.env.ADMIN_EMAIL,
                password:process.env.ADMIN_PWD
               }
           }
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
                   // bcrypt.compare(userData.password, admin.password).then((status) => { -----  })    <------if stored in database
                        if (admin.password==userData.password) {
                            console.log('login success')
                            response.admin = admin
                            response.status = true
                            resolve(response)

                        } else {
                            var err = 'Incorrect password'
                            reject(err)
                        }

                } else {
                    var err = 'Invalid email or password'
                    reject(err)
                }
            }
        })
    },

    /* -------------------------------- OTP login ------------------------------- */

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

     /* -------------------------------------------------------------------------- */
     /*                           User Account Management                          */
     /* -------------------------------------------------------------------------- */

     /* --------------------------- Logged user details -------------------------- */

    getuserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((data) => {
                resolve(data)
            }).catch((err) => {
                reject(err)
            })
        })
    },

    /* --------------------------- User details update -------------------------- */

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

    /* --------------------------- User address update -------------------------- */

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

    /* -------------------------- User password update -------------------------- */

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

    /* --------------------------- User address delete -------------------------- */

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

   /* -------------------------------------------------------------------------- */
   /*                                  User Cart                                 */
   /* -------------------------------------------------------------------------- */

   /* --------------------------- Add product to cart -------------------------- */
    addToCart: async (proId, userId, data) => {
        var dPrice = parseFloat(data.dPrice)    // data.dPrice is the discount price which is calculated in product_details router
        let proData = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
        console.log(proData.name)
        let proObj = {
            item: objectId(proId),
            name: proData.name,
            price: dPrice,     // to store the discount price of the particular product
            size: data.size,
            quantity: 1,
            categoryId: proData.categoryId,
            subtotal: dPrice   // to store the price of the product according to quantity 
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
                    total_amount: 0,
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    /* -------------------------- Cart added product details -------------------------- */

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
                        quantity: '$products.quantity',
                        size: '$products.size',
                        subtotal: '$products.subtotal',
                        price: '$products.price',
                        name: '$products.name',
                        categoryId: '$products.categoryId'
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
                        size: 1,
                        price: 1,
                        name: 1,
                        categoryId: 1,
                        products: {
                            $arrayElemAt: ['$products', 0]
                        }
                    }
                }
            ]).toArray()
            console.log(cartItems)
            resolve(cartItems)
        })
    },

    /* ------------------------- Number of Items in cart ------------------------ */

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

    /* ------------------ Change quantity of a particular product ----------------- */

    changeProductQuantity: (details) => {
        count = parseInt(details.count)
        quantity = parseInt(details.quantity)
        details.subtotal = parseFloat(details.subtotal)

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

    /* ------------------------ Remove product from cart ------------------------ */

    removeFromCart: (ids) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(ids.cartId) },
                    {
                        $pull: { products: { item: objectId(ids.proId) } }
                    }
                ).then((response) => {
                    resolve({ removeProduct: true })
                }).catch((err) => {
                    reject(err)
                })
        })
    },

    /* ---------------- Offer added total of all products(x quantity) in cart --------------- */

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
                await db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                    {
                        $set: {
                            "total_amount": total[0].total,
                        }
                    })

                db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) }).then((totalAmount) => {

                    resolve(totalAmount?.total_amount)
                }).catch((err)=>{
                    reject(err)
                })
            } else {
                resolve(0)
            }
        })
    },

    /* ---------------- Actual price total of all products(x quantity) in cart --------------- */

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

    /* ---------------------- List of products inside cart ---------------------- */

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    }

}