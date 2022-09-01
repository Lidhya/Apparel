const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const { resolve, reject } = require('promise')
const { Timestamp } = require('mongodb')
const { response } = require('express')
const objectId = require('mongodb').ObjectId

module.exports = {

    addProduct: async (productData, callback) => {
        console.log(productData)
        let categoryId = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: productData.category })
        productData.stock = parseInt(productData.stock)
        productData.actual_price = parseFloat(productData.actual_price)
        productData.discount_price = parseFloat(productData.discount_price)
        let product = {
            name: productData.name,
            description: productData.description,
            category: productData.category,
            sizes: productData.sizes,
            stock: productData.stock,
            material_type: productData.material_type,
            actual_price: productData.actual_price,
            discount_price: productData.discount_price,
            categoryId: categoryId._id,
            inserted_date: new Date().toISOString(),
        }
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {

            callback(data.insertedId)
        }).catch((err) => {
            console.log(err)
        })
    },

    addImagePath:(image_path,proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
            {
                $set:{
                    image_path:image_path
                }
            }).then((response)=>{
                resolve()
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, proData) => {
        return new Promise(async (resolve, reject) => {
            let categoryId = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: proData.category })
            proData.stock = parseInt(proData.stock)
            proData.actual_price = parseFloat(proData.actual_price)
            proData.discount_price = parseFloat(proData.discount_price)
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(proId) }, {
                    $set: {
                        name: proData.name,
                        description: proData.description,
                        category: proData.category,
                        sizes: proData.sizes,
                        stock: proData.stock,
                        material_type: proData.material_type,
                        actual_price: proData.actual_price,
                        discount_price: proData.discount_price,
                        categoryId: categoryId._id,
                        modified_date: new Date().toISOString(),
                    }
                }).then((response) => {
                    resolve(response)
                })
        })
    },

    getCategories: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((categories) => {
                // console.log(categories);
                resolve(categories)
            })

        })

    },

    addCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                resolve(data)
            }).catch((err) => {
                console.log(err)
                reject(err)
            })
        })

    },
    deleteCategory: (catId) => {
        return new Promise(async(resolve, reject) => {
            console.log(objectId(catId))
            let query = { _id: objectId(catId) };
            let proCheck= await db.get().collection(collection.PRODUCT_COLLECTION).find({categoryId: objectId(catId)})
            if(proCheck){
                let err= 'Products exist in this category'
                reject(err)
            }else{
                db.get().collection(collection.CATEGORY_COLLECTION).deleteOne(query).then((response) => {
                    console.log(response)
                    resolve(response)
                })
            }
           
        })
    },
    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            console.log(objectId(proId))
            let query = { _id: objectId(proId) };
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne(query).then((response) => {
                console.log(response)
                resolve(response)
            })
        })
    }

}

