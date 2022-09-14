const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const moment = require('moment');
const objectId = require('mongodb').ObjectId

module.exports = {
    /* -------------------------------------------------------------------------- */
    /*                          category offer Management                         */
    /* -------------------------------------------------------------------------- */

    getOffers: () => {
        return new Promise((resolve, reject) => {
            try {
                let currentDate = moment(new Date()).format('YYYY-MM-DD')
                db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((categories) => {
                    for (let i in categories) {
                        if (categories[i].offer) {
                            if (categories[i].offer.valid_till <= currentDate) {
                                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(categories[i]._id) },
                                    {
                                        $set: {
                                            "offer.isEnabled": false,
                                            "offer.isExpired": true,
                                        }
                                    })
                            }
                        }
                    }
                }).catch((err) => { reject(err) })
                db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((category) => {
                    resolve(category)
                }).catch((err) => { reject(err) })
            } catch (err) {
                reject(err)
            }
        })

    },

    /* ---------------------- get categories without offer --------------------- */
    getNonOfferCat: () => {
        return new Promise((resolve, reject) => {
                try {
                db.get().collection(collection.CATEGORY_COLLECTION).find({ "offer.isExpired": { $ne: false } }).toArray().then((category) => {
                    resolve(category)
                }).catch((err)=>{reject(err)})
            } catch (err) {
                reject(err)
            }
            })
    },

    /* ------------------------------ add new category offer ----------------------------- */
    addOffer: (offerData) => {
        return new Promise(async (resolve, reject) => {
                try {
                    let {categoryId, percent }=offerData
                let categories = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) })
                if (categories.offer?.isEnabled) {
                    let err = "The selected category already have an offer"
                    reject(err)
                } else {
                    percent = parseFloat(percent)
                    offerData.isEnabled = true
                    offerData.isExpired = false
                    db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(categoryId) }, {
                        $set: { offer: offerData }
                    }).then((data)=> {
                        resolve(data)
                    }).catch((err) => {
                        reject(err)
                    })
                }
            } catch (err) {
                err='something went wrong'
                reject(err)
            }
            })
    },

    /* ---------------------------- get category offer details --------------------------- */
    getOffer: (catId) => {
        return new Promise((resolve, reject) => {
                try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((offerData) => {
                    resolve(offerData)
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
            })
    },

    /* ------------------------------- edit category offer ------------------------------- */
    editOffer: (offerData) => {
        return new Promise((resolve, reject) => {
                try {
                    const {categoryId, percent, valid_from, valid_till }=offerData
                offerObj = {
                    percent: parseFloat(percent),
                    categoryId: categoryId,
                    valid_from: valid_from,
                    valid_till: valid_till,
                    isEnabled: false,
                    isExpired: false,
                }
                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(categoryId) },
                    {
                        $set: { offer: offerObj }
                    }).then((data) => {
                        resolve(data)
                    }).catch((err) => {
                        reject(err)
                    })
                } catch (err) {
                    reject(err)
                }
            })
    },

    /* -------------------------- enable category offer ------------------------- */
    enableOffer: (catId) => {
        return new Promise((resolve, reject) => {
                try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) }, {
                    $set: { "offer.isEnabled": true }
                }).then((data) => {
                    resolve()
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
            })
    },

    /* -------------------------- disable category offer ------------------------- */
    disableOffer: (catId) => {
        return new Promise((resolve, reject) => {
                try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) }, {
                    $set: { "offer.isEnabled": false }
                }).then((data) => {
                    resolve()
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
            })
    },

    /* -------------------------- delete category offer ------------------------- */
    deleteOffer: (catId) => {
        return new Promise((resolve, reject) => {
                try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) }, {
                    $unset: { offer: "" }
                }).then((data) => {
                    resolve()
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
            })
    },


    /* -------------------------------------------------------------------------- */
    /*                             referral Management                            */
    /* -------------------------------------------------------------------------- */

    getReferrals: () => {
        return new Promise((resolve, reject) => {
                try {
                db.get().collection(collection.REFERRAL_COLLECTION).find().toArray().then((data) => {
                    resolve(data[0])
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
            })
    },

    /* --------------------------- edit referral offer -------------------------- */
    editReferrals: (referralData) => {
        return new Promise(async (resolve, reject) => {
                try {
                    const {referrer_offer: refOffer, referee_offer:refreOffer}=referralData
                let refData = {
                    "referrer_offer": parseInt(refOffer),
                    "referee_offer": parseInt(refreOffer)
                }
                let referalCheck = await db.get().collection(collection.REFERRAL_COLLECTION).findOne()
                if (referalCheck) {

                    db.get().collection(collection.REFERRAL_COLLECTION).updateOne({ _id: objectId(referalCheck._id) }, {
                        $set: {
                            "referrer_offer": parseInt(refOffer),
                            "referee_offer": parseInt(refreOffer)
                        }
                    }).then((data) => {
                        resolve(data)
                    }).catch((err) => {
                        reject(err)
                    })
                } else {
                    db.get().collection(collection.REFERRAL_COLLECTION).insertOne(refData).then((data) => {
                        resolve()
                    }).catch((err) => {
                        reject(err)
                    })
                }
            } catch (err) {
                reject(err)
            }
            })

    },


    /* -------------------------------------------------------------------------- */
    /*                              Coupon Management                             */
    /* -------------------------------------------------------------------------- */

    createCoupon: (couponData) => {
        try {
            return new Promise(async (resolve, reject) => {
                let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ "coupon_code": couponData.coupon_code })
                console.log(couponData.coupon_code + ' ' + couponCheck);
                if (couponCheck) {
                    let err = 'Coupon code already exist'
                    reject(err)
                } else {
                    couponData.status = true
                    couponData.isExpired = false
                    couponData.amount_off = parseFloat(couponData.amount_off)
                    couponData.minimum_purchase = parseFloat(couponData.minimum_purchase)
                    couponData.inserted_date = new Date()

                    db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then(() => {
                        resolve()
                    }).catch((err) => {
                        reject(err)
                    })
                }
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }
    },

    /* ------------------------------ edit a coupon ----------------------------- */
    editCoupon: (couponData, couponId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: { $ne: objectId(couponId) }, "coupon_code": couponData.coupon_code })
                if (couponCheck) {
                    let err = 'Coupon code already exist'
                    reject(err)
                } else {
                    couponData.amount_off = parseFloat(couponData.amount_off)
                    couponData.minimum_purchase = parseFloat(couponData.minimum_purchase)
                    db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponId) },
                        {
                            $set: {
                                "coupon_code": couponData.coupon_code,
                                "amount_off": couponData.amount_off,
                                "minimum_purchase": couponData.minimum_purchase,
                                "valid_from": couponData.valid_from,
                                "valid_till": couponData.valid_till,
                                "modified-date": new Date()
                            }
                        }).then(() => {
                            resolve()
                        }).catch((err) => {
                            err = "something went wrong"
                            reject(err)
                        })
                }
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }
    },

    /* --------------------------- get coupon details --------------------------- */
    getCoupon: (couponId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.COUPON_COLLECTION).findOne({ _id: objectId(couponId) }).then((coupon) => {
                    resolve(coupon)
                }).catch((err) => {
                    reject(err)
                })
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }

    },

    /* ----------------------------- get all coupons ---------------------------- */
    getAllCoupons: () => {
        try {
            return new Promise((resolve, reject) => {
                let date = new Date()
                let currentDate = moment(date).format('YYYY-MM-DD')
                db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((couponData) => {
                    for (let i in couponData) {
                        if (couponData[i].valid_till <= currentDate) {
                            db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponData[i]._id) },
                                {
                                    $set: {
                                        "status": false,
                                        "isExpired": true,
                                    }
                                })
                            couponData[i].status = false
                            couponData[i].isExpired = true
                        } else if (couponData[i].valid_till > currentDate) {
                            db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponData[i]._id) },
                                {
                                    $set: {
                                        "isExpired": false,
                                    }
                                })
                            couponData[i].isExpired = false
                        }
                    }
                    console.log(couponData);
                    resolve(couponData)

                })
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }

    },

    /* ------------------------------ enable coupon ----------------------------- */
    enableCoupon: (couponId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponId) },
                    {
                        $set: { "status": true }
                    }).then((data => {
                        resolve()
                    })).catch((err) => {
                        reject(err)
                    })
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }

    },

    /* ----------------------------- disable coupon ----------------------------- */
    disableCoupon: (couponId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponId) }, {
                    $set: { "status": false }
                }).then((data => {
                    resolve()
                })).catch((err) => {
                    reject(err)
                })
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }

    },

    /* ------------------------------ delete coupon ----------------------------- */
    deleteCoupon: (couponId) => {
        try {
            return new Promise((resolve, reject) => {
                db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((data => {
                    resolve()
                })).catch((err) => {
                    reject(err)
                })
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }
    },

    /* ------------------------------- get coupons in user side------------------------------ */
    getCoupons: () => {
        try {
            return new Promise((resolve, reject) => {
                let date = new Date()
                let currentDate = moment(date).format('YYYY-MM-DD')
                db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((couponData) => {
                    for (let i in couponData) {
                        if (couponData[i].valid_till <= currentDate) {
                            db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponData[i]._id) },
                                {
                                    $set: {
                                        "status": false,
                                        "isExpired": true
                                    }
                                })
                        }
                    }
                    db.get().collection(collection.COUPON_COLLECTION).find({ status: true }).toArray().then((coupons) => {
                        resolve(coupons)
                    }).catch((err) => {
                        console.log(err)
                        reject(err)
                    })

                })
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }

    },

    applyCoupon: (couponCode, userId) => {
        try {
            return new Promise(async (resolve, reject) => {
                let couponCheck = await db.get().collection(collection.COUPON_COLLECTION).findOne({ "coupon_code": couponCode, "status": true })
                if (couponCheck) {
                    let appliedCoupon = {
                        couponId: couponCheck._id,
                        coupon_code: couponCode,
                        amount_off: couponCheck.amount_off,
                        minimum_purchase: couponCheck.minimum_purchase
                    }
                    let couponUsed = await db.get().collection(collection.USEDCOUPON_COLLECTION).findOne({ "coupon_code": couponCode, "user": objectId(userId) })
                    if (couponUsed) {
                        let err = "Coupon already used"
                        reject(err)
                    } else {
                        resolve(appliedCoupon)
                    }
                } else {
                    let err = "coupon doesn't exist or has been expired"
                    reject(err)
                }
            })
        } catch (err) {
            res.status('404').redirect('/error')
        }

    },

    addUsedCoupon: (couponData, userId, total) => {
        try {
            return new Promise(async (resolve, reject) => {
                let couponObj = {
                    user: objectId(userId),
                    couponId: objectId(couponData.couponId),
                    coupon_code: couponData.coupon_code,
                    minimum_purchase: couponData.minimum_purchase,
                    totalSpend: total,
                    date: new Date()
                }
                db.get().collection(collection.USEDCOUPON_COLLECTION).insertOne(couponObj).then((data) => {
                    resolve()
                }).catch(() => {
                    reject()
                })

            })
        } catch (err) {
            res.status('404').redirect('/error')
        }
    }

}