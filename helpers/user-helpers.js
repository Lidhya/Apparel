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
            try{
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
                    let referralOffers = await db.get().collection(collection.REFERRAL_COLLECTION).findOne()
                    const {referrer_offer, referee_offer}=referralOffers
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
                    }).catch((err)=>{reject(err)})
                }
            }
        }catch(err){
            err='something went wrong'
            reject(err)
        }

        })
    },

   /* ----------------------------- User and admin login ----------------------------- */
    doLogin: (userData) => {       
        return new Promise(async (resolve, reject) => {
            try{
            const {email, password}=userData
           // let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email })   <------if stored in database
           let admin=false
           if(process.env.ADMIN_EMAIL==email){
                admin={
                email:process.env.ADMIN_EMAIL,
                password:process.env.ADMIN_PWD
               }
           }
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: email })
            let response = {}
            if (!admin && user.block === true) {
                let err = "Your account is blocked"
                reject(err)
            } else {
                if (user) {
                    bcrypt.compare(password, user.password).then((status) => {
                        if (status) {
                            response.user = user
                            response.status = true
                            resolve(response)

                        } else {
                            let err = 'Incorrect password'
                            reject(err)
                        }
                    })
                } else if (admin) {
                   // bcrypt.compare(userData.password, admin.password).then((status) => { -----  })    <------if stored in database
                        if (admin.password==password) {
                            response.admin = admin
                            response.status = true
                            resolve(response)
                        } else {
                            let err = 'Incorrect password'
                            reject(err)
                        }
                } else {
                    let err = 'Invalid email or password'
                    reject(err)
                }
            }
        }catch(err){
            err='something went wrong'
            reject(err)
        }
        })
    },

    /* -------------------------------- OTP login ------------------------------- */
    otpLogin: (phone) => {
        return new Promise(async (resolve, reject) => {
            try{
            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: phone })
            let response = {}
            if (userCheck) {
                response.user = userCheck
                response.status = true
                resolve(response)
            } else {
                reject('The number is not registered')
            }
        }catch(err){
            err='something went wrong'
            reject(err)
        }

        })
    },

     /* -------------------------------------------------------------------------- */
     /*                           User Account Management                          */
     /* -------------------------------------------------------------------------- */

     /* --------------------------- Logged user details -------------------------- */

    getuserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((data) => {
                resolve(data)
            }).catch((err) => {
                reject(err)
            })
        } catch (err) {
            reject(err)
        }
        })
    },

    /* --------------------------- User details update -------------------------- */

    updateProfile: (details, userId) => {
        return new Promise(async (resolve, reject) => {
            try{
                const {fname, lname, email, password, phone}=details
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            let emailCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: { $ne: objectId(userId) }, email: email })
            bcrypt.compare(password, user.password).then((status) => {
                if (status) {
                    if (emailCheck) {
                        let err = 'Email already registered by someone else'
                        reject(err)
                    } else {
                        db.get().collection(collection.USER_COLLECTION).findOneAndUpdate({ _id: objectId(userId) }, {
                            $set: {
                                fname: fname,
                                lname: lname,
                                email: email,
                                phone: phone
                            }
                        }).then(async (status) => {
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
            }).catch((err)=>{
                err='something went wrong'
                reject(err)
            })

        } catch (err) {
            err='something went wrong'
            reject(err)
        }
        })

    },

    /* --------------------------- User address update -------------------------- */

    updateAddress: (addressData, userId) => {
        return new Promise(async (resolve, reject) => {
            try{
                const {title, address, city, pincode, phone}=addressData
            let addressObj = {
                title: title,
                address: address,
                city: city,
                pincode: pincode,
                phone: phone
            }
            let userCheck = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId), addresses: { $elemMatch: { title: title } } })
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
                    err='something went wrong'
                    reject(err)
                })
            }
        } catch (err) {
            err='something went wrong'
            reject(err)
        }

        })
    },

    /* -------------------------- User password update -------------------------- */

    updatePassword: (pwdData, userId) => {
        return new Promise(async (resolve, reject) => {
            try{
                let {password, new_password}=pwdData
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            bcrypt.compare(password, user.password).then(async (status) => {
                if (status) {
                    new_password = await bcrypt.hash(new_password, 10)
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                        $set: {
                            password: new_password
                        }
                    }).then((data) => {
                        resolve(data)
                    }).catch((err)=>{
                         err = 'Cannot update try again'
                        reject(err)
                    })
                } else {
                    err = 'Incorrect password'
                    reject(err)
                }
            }).catch((err)=>{
                err='something went wrong'
                    reject(err)
            })
        } catch (err) {
            err='something went wrong'
            reject(err)
        }
        })
    },

    /* --------------------------- User address delete -------------------------- */

    deleteAddress: async (title, userId) => {
        return new Promise((resolve, reject) => {
            try{
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $pull: {
                    addresses: { title: title }
                }
            }).then(async (response) => {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
                resolve(user)
            }).catch((err)=>{
                reject(err)
            })
        } catch (err) {
            reject(err)
        }
        })
    },   

   /* -------------------------------------------------------------------------- */
   /*                                  User Cart                                 */
   /* -------------------------------------------------------------------------- */

   /* --------------------------- Add product to cart -------------------------- */
   addToCart: async (proId, userId, data) => {
        return new Promise(async (resolve, reject) => {
            try{
        let dPrice = parseFloat(data.dPrice)    // data.dPrice is the discount price which is calculated in product_details router
        let proData = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) })
        let proObj = {
            item: objectId(proId),
            name: proData.name,
            price: dPrice,     // to store the discount price of the particular product
            size: data.size,
            quantity: 1,
            categoryId: proData.categoryId,
            subtotal: dPrice   // to store the price of the product according to quantity 
        }
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
                        }).catch((err)=>{reject(err)})
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: {
                                products: proObj
                            }
                        }
                    ).then((response) => {
                        resolve(response)
                    }).catch((err)=>{reject(err)})
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    total_amount: 0,
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                }).catch((err)=>{reject(err)})
            }
        } catch (err) {
            reject(err)
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