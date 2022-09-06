const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const { resolve, reject } = require('promise')
const moment = require('moment');
const objectId = require('mongodb').ObjectId

module.exports = {
    getOffers: () => {
        return new Promise((resolve, reject) => {
            let date = new Date()
            let currentDate = moment(date).format('YYYY-MM-DD')
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((categories) => {
              for(let i in categories)
              {
                if(categories[i].offer){
                    if(categories[i].offer.valid_till<=currentDate){
                        db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({_id:objectId(categories[i]._id)},
                        {
                            $set:{
                                "offer.isEnabled":false,
                                "offer.isExpired":true,
                            }
                        })
                    }
                }
               
              }
            })
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((category)=>{
                resolve(category)
            })
        })

    },

    addOffer: (offerData) => {
        return new Promise(async (resolve, reject) => {
            let query = objectId(offerData.categoryId)
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION).findOne(query)
            if (categories.offer) {
                let err = "The selected category already have an offer"
                reject(err)
            } else {
                offerData.percent = parseFloat(offerData.percent)
                offerData.isEnabled = true
                offerData.isExpired = false
                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(query) }, {
                    $set: { offer: offerData }
                }).then((data => {
                    resolve()
                })).catch((err) => {
                    reject(err)
                })
            }

        })
    },
    getOffer: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(catId) }).then((offerData) => {
                resolve(offerData)
            }).catch((err) => {
                reject(err)
            })
        })
    },
    editOffer: (offerData) => {
        return new Promise((resolve, reject) => {
            let query = offerData.categoryId
            offerData.percent = parseInt(offerData.percent)
            offerObj = {
                percent: offerData.percent,
                categoryId:offerData.categoryId,
                valid_from:offerData.valid_from,
                valid_till:offerData.valid_till,
                isEnabled:false,
                isExpired:false,
            }
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(query) }, {
                $set: { offer: offerObj }
            }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },
    enableOffer: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) }, {
                $set: { "offer.isEnabled": true }
            }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },
    disableOffer: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) }, {
                $set: { "offer.isEnabled": false }
            }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },

    deleteOffer: (catId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({ _id: objectId(catId) }, {
                $unset: { offer: "" }
            }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },

    // --------------------------Coupon Management------------------------------- //

    createCoupon:(couponData)=>{
        return new Promise(async(resolve,reject)=>{
            try{
                couponData.status=true
                couponData.isExpired=false
                couponData.amount_off=parseFloat(couponData.amount_off)
                couponData.minimum_purchase=parseFloat(couponData.minimum_purchase)
                  db.get().collection(collection.COUPON_COLLECTION).insertOne(couponData).then(()=>{
                    resolve()
                  }).catch((err)=>{
                    reject(err)
                  })

            }catch(err){
                err="something went wrong"
               resolve.status('404')
                reject(err)
            }         
        })
    },

    editCoupon:(couponData, couponId)=>{
        return new Promise(async(resolve,reject)=>{
            try{
                couponData.amount_off=parseFloat(couponData.amount_off)
                couponData.minimum_purchase=parseFloat(couponData.minimum_purchase)
                  db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({_id:objectId(couponId)},
                  {
                    $set:{
                        "coupon_code":couponData.coupon_code,
                        "amount_off":couponData.amount_off,
                        "minimum_purchase":couponData.minimum_purchase,
                        "valid_from":couponData.valid_from,
                        "valid_till":couponData.valid_till,
                    }
                  }).then(()=>{
                    resolve()
                  }).catch((err)=>{
                    reject(err)
                  })

            }catch(err){
                err="something went wrong"
               res.status('404')
                reject(err)
            }
             
        })
    },

    getCoupon:(couponId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).findOne({_id:objectId(couponId)}).then((coupon)=>{
                resolve(coupon)
            }).catch((err)=>{
                reject(err)
            })
        })

    },
    
    getAllCoupons:()=>{
        return new Promise((resolve,reject)=>{
            let date = new Date()
            let currentDate = moment(date).format('YYYY-MM-DD')
            db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((couponData)=>{
                for(let i in couponData)
                {
                      if(couponData[i].valid_till<=currentDate ){
                        db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({_id:objectId(couponData[i]._id)},
                        {
                            $set:{
                                "status":false,
                                "isExpired":true,
                            }
                        })
                        couponData[i].status=false
                        couponData[i].isExpired=true
                      }else if(couponData[i].valid_till>currentDate){
                        db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({_id:objectId(couponData[i]._id)},
                        {
                            $set:{
                                "isExpired":false,
                            }
                        })
                        couponData[i].isExpired=false
                      }
                }
                console.log(couponData);
                resolve(couponData)
                
            })
        })
    },

    enableCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponId) }, {
                $set: { "status": true }
            }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },

    disableCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({ _id: objectId(couponId) }, {
                $set: { "status": false }
            }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },

    deleteCoupon: (couponId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then((data => {
                resolve()
            })).catch((err) => {
                reject(err)
            })
        })
    },

    getCoupons:()=>{
        return new Promise((resolve,reject)=>{
            let date = new Date()
            let currentDate = moment(date).format('YYYY-MM-DD')
            db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((couponData)=>{
                for(let i in couponData)
                {
                      if(couponData[i].valid_till<=currentDate ){
                        db.get().collection(collection.COUPON_COLLECTION).findOneAndUpdate({_id:objectId(couponData[i]._id)},
                        {
                            $set:{
                                "status":false,
                                "isExpired":true,
                            }
                        })
                      }
                }
                db.get().collection(collection.COUPON_COLLECTION).find({status:true}).toArray().then((coupons)=>{
                    resolve(coupons)
                }).catch((err)=>{
                    console.log(err)
                    reject(err)
                })
                
            })
        })
    },

    applyCoupon:(couponCode, userId)=>{
        return new Promise(async(resolve,reject)=>{
           let couponCcouponCheckheck= await db.get().collection(collection.COUPON_COLLECTION).findOne({"coupon_code":couponCode, "status":true})
           if(couponCheck){
           let appliedCoupon={
                couponId:couponCheck._id,
                coupon_code: couponCode,
                amount_off: couponCheck.amount_off,
                minimum_purchase: couponCheck.minimum_purchase
            }
            let couponUsed=await db.get().collection(collection.USEDCOUPON_COLLECTION).findOne({"coupon_code":couponCode, "user":objectId(userId)})
            if(couponUsed){
                let err="coupon already used"
            reject(err)
            }else{

                resolve(appliedCoupon)
            }
           }else{
            let err="coupon doesn't exist or has been expired"
            reject(err)
           }
        })
    },

    addUsedCoupon:(couponData, userId, total)=>{
        return new Promise(async(resolve, reject)=>{
            let couponObj={
                user:objectId(userId),
                couponId:objectId(couponData.couponId),
                coupon_code:couponData.coupon_code,
                minimum_purchase:minimum_purchase,
                totalSpend:total
            }
            db.get().collection(collection.USEDCOUPON_COLLECTION).insertOne(couponObj).then((data)=>{
                resolve()
            }).catch(()=>{
               reject()
            })
        })
    }
}