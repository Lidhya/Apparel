const express = require('express');
const router = express.Router();
const fs = require('fs');
const productHelper = require("../helpers/product-helpers")
const adminHelpers = require("../helpers/admin-helpers");
const productHelpers = require('../helpers/product-helpers');
const offerHelpers = require('../helpers/offer-helpers');
const orderHelpers = require('../helpers/order-helpers');
const path = require('path');




const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/')
  }
}
/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {
    if (req.session.loggedIn && req.session.admin) {
      var admin = req.session.admin
      let details = await adminHelpers.getReport()
      res.setHeader('cache-control', 'no-store')
      res.render('admin/dashboard', { title: " | Admin", admin, details });
    } else {
      res.redirect('/')
    }
  } catch (err) {
    err = "No sufficient data available"
    res.status('404').json(err)
  }
});

/* ----------------------- Dashboard data through ajax ---------------------- */
router.get('/get-report', verifyLogin, async (req, res) => {
  try {
    let details = await adminHelpers.getReport()
    res.json(details)
  } catch (err) {
    err = "No sufficient data available"
    res.status('404').json(err)
  }

})

/* ----------------------------- Product management ---------------------------- */
router.get('/products', verifyLogin, (req, res, next) => {
  try{
    res.setHeader('cache-control', 'no-store')
  productHelper.getAllProducts().then((products) => {
    res.render('admin/products', { title: " | Admin", admin: true, products });
  }) 
  }catch(err){
    res.status('404').json(err)
  }
 
});

router.get('/add-product', verifyLogin, async (req, res, next) => {
  try{
  let categories = await productHelpers.getCategories()
  res.render('admin/add-product', { title: " | Admin", admin: true, categories, "updateStatus": req.session.updateStatus });
  req.session.updateStatus = false
}catch(err){
  res.status('404').json(err)
}
})

router.post('/add-product', (req, res) => {
  try{
  console.log(req.body)
  productHelper.addProduct(req.body, (id) => {
    let images = []
    let image_path = []
    if (req.files?.Image1) { images.push(req.files?.Image1) }
    if (req.files?.Image2) { images.push(req.files?.Image2) }
    if (req.files?.Image3) { images.push(req.files?.Image3) }
    if (images.length) {
      for (let i = 0; i < images.length; i++) {
        var uploadPath = './public/product-images/' + id + '-' + i + '.jpg'
        var img = '/product-images/' + id + '-' + i + '.jpg'
        image_path.push(img)
        images[i]?.mv(uploadPath, (err) => {
          if (err) {
            console.log(err);
            req.session.updateStatus = "Something went wrong"
            return res.status(500).send(err);
          } else {
            req.session.updateStatus = "Product added successfully"
          }
        })
      }
    }
    productHelper.addImagePath(image_path, id).then((response) => {
      res.redirect('/admin/add-product')
    }).catch((err) => {
      console.log(err);
    })
  })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/product-edit/:id', verifyLogin, async (req, res) => {
  try{
  let categories = await productHelpers.getCategories()
  let proId = req.params.id;
  productHelper.getProductDetails(proId).then((productDetails) => {
    console.log(productDetails);
    res.render('admin/edit-product', { title: " | Admin", productDetails, categories, admin: true, "proErr": req.session.proErr });
    req.session.proErr = false;
  });
}catch(err){
  res.status('404').json(err)
}
})

router.post('/edit-product/:id', verifyLogin, (req, res) => {
  try{
  productHelpers.updateProduct(req.params.id, req.body).then((response) => {
    console.log('vann vann  ' + response)
    let id = req.params.id

    if (req.files?.Image1) {
      console.log('vann vann  img 1')
      let image1 = req.files?.Image1
      fs.unlinkSync('./public/product-images/' + id + '-0.jpg')
      image1.mv('./public/product-images/' + id + '-0.jpg', (err) => {
        if (err) {
          console.log(err);
        }
      })
    }

    if (req.files?.Image2) {
      console.log('vann vann  img2')
      let image2 = req.files?.Image2
      fs.unlinkSync('./public/product-images/' + id + '-1.jpg')
      image2.mv('./public/product-images/' + id + '-1.jpg', (err) => {
        if (err) {
          console.log(err);
        }
      })
    }

    if (req.files?.Image3) {
      console.log('vann vann  img3')
      let image3 = req.files?.Image3
      var imgpath3 = '/product-images/' + id + '-2.jpg'
      fs.unlinkSync('./public/product-images/' + id + '-2.jpg')
      image3.mv('./public/product-images/' + id + '-2.jpg', (err) => {
        if (err) {
          console.log(err);
        }
      })
    }
    res.redirect('/admin/products')
  })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/delete-products/:id', verifyLogin, (req, res) => {
  try{
  let proId = req.params.id
  console.log(proId)
  for (let i = 0; i < 3; i++) {
    fs.unlinkSync('./public/product-images/' + proId + '-' + i + '.jpg')
  }
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/products')
  })
}catch(err){
  res.status('404').json(err)
}
})

/* ----------------------------- User management ---------------------------- */
router.get('/users', verifyLogin, (req, res, next) => {
  try{
  adminHelpers.getAllUsers().then((usersData) => {
    res.setHeader('cache-control', 'no-store')
    res.render("admin/users", { title: " | Admin", usersData, admin: true, "updateStatus": req.session.updateStatus })
    req.session.updateStatus = false
  })
}catch(err){
  res.status('404').json(err)
}
});

router.get('/user-block/:id', verifyLogin, (req, res) => {
  try{
  let userId = req.params.id;
  adminHelpers.blockUser(userId).then((response) => {
    res.redirect('/admin/users')
  })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/user-unblock/:id', verifyLogin, (req, res) => {
  try{
  let userId = req.params.id;
  adminHelpers.unblockUser(userId).then((response) => {
    res.redirect('/admin/users')
  })
}catch(err){
  res.status('404').json(err)
}
})

/* ----------------------------- Category management ---------------------------- */
router.get('/categories', verifyLogin, async (req, res, next) => {
  try{
  let categories = await productHelpers.getCategories()
  res.setHeader('cache-control', 'no-store')
  res.render('admin/categories', { admin: true, categories, "catErr": req.session.catErr });
  req.session.catErr = false
}catch(err){
  res.status('404').json(err)
}
})

router.post('/add-category', (req, res) => {
  try{
  productHelper.addCategory(req.body).then((data) => {
    res.redirect('/admin/categories')
  })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/delete-category/:id', verifyLogin, (req, res) => {
  try{
  let catId = req.params.id
  console.log(catId)
  productHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/categories')
  }).catch((err) => {
    req.session.catErr = err
    res.redirect('/admin/categories')
  })
}catch(err){
  res.status('404').json(err)
}
})

/* ----------------------------- Order management ---------------------------- */

router.get('/all-orders', verifyLogin, async (req, res) => {
  try{
  let orders = await orderHelpers.getAllOrders()
  res.render('admin/all-orders', { title: " | Admin", admin: true, orders })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/cancel-order/:id', verifyLogin, (req, res) => {
  try{
  let orderId = req.params.id
  orderHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/admin/all-orders')
  })
}catch(err){
  res.status('404').json(err)
}
})

router.post('/update-order/:id', verifyLogin, (req, res) => {
  try{
  let orderId = req.params.id
  console.log(req.body)
  orderHelpers.updateOrder(orderId, req.body).then((response) => {
    res.redirect('/admin/all-orders')
  })
}catch(err){
  res.status('404').json(err)
}
})

/* ------------------------- Update delivery status ------------------------- */
router.post('/update-status/:id', verifyLogin, (req, res) => {
  try{
  let orderId = req.params.id
  console.log(req.body)
  orderHelpers.updateStatus(orderId, req.body).then((response) => {
    res.redirect('/admin/all-orders')
  })
}catch(err){
  res.status('404').json(err)
}
})

/* ----------------------------- Category & referral offer management ---------------------------- */

router.get('/category-offers', verifyLogin, async (req, res) => {
  try{
  let categories = await offerHelpers.getOffers()
  let referrals = await offerHelpers.getReferrals()
  res.render('admin/category-offers', { title: " | Admin", admin: true, categories, referrals })
}catch(err){
  res.status('404').json(err)
}
})

router.post('/edit-referrals', verifyLogin, (req, res) => { 
  try{
  offerHelpers.editReferrals(req.body).then((data) => {
    res.redirect('/admin/category-offers')
  })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/add-offer', verifyLogin, async (req, res) => {
  try{
  let categories = await offerHelpers.getNonOfferCat() //get categories with no existing offers
  res.render('admin/add-cate-offer', { title: " | Admin", admin: true, categories, "offerErr": req.session.offerErr })
  req.session.offerErr = false
}catch(err){
  res.status('404').json(err)
}
})

router.post('/add-offer', verifyLogin, async (req, res) => {
  try{
  offerHelpers.addOffer(req.body).then((response) => {
    res.redirect('/admin/category-offers')
  }).catch((err) => {
    req.session.offerErr = err
    res.redirect('/admin/add-offer')
  })
}catch(err){
  res.status('404').json(err)
}
})

router.get('/edit-offer/:id', verifyLogin, async (req, res) => {
  try{
  let categories = await productHelpers.getCategories()
  let offerDetails = await offerHelpers.getOffer(req.params.id)
  res.render('admin/edit-cate-offer', { title: " | Admin", admin: true, categories, offerDetails })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/offer-enable/:id', verifyLogin, async (req, res) => {
  try{
  offerHelpers.enableOffer(req.params.id).then((response) => {
    res.redirect('/admin/category-offers')
  })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/offer-disable/:id', verifyLogin, async (req, res) => {
  try{
  offerHelpers.disableOffer(req.params.id).then((response) => {
    res.redirect('/admin/category-offers')
  })
   }catch(err){
    res.status('404').json(err)
  }
})

router.post('/edit-offer', verifyLogin, async (req, res) => {
  try{
  offerHelpers.editOffer(req.body).then((response) => {
    res.redirect('/admin/category-offers')
  })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/delete-offer/:id', verifyLogin, async (req, res) => {
  try{
  let categories = await offerHelpers.deleteOffer(req.params.id)
  res.render('admin/add-cate-offer', { title: " | Admin", admin: true, categories })
   }catch(err){
    res.status('404').json(err)
  }
})

/* ---------------------------- Coupon management --------------------------- */
router.get('/coupons', verifyLogin, async (req, res) => {
  try{
  let coupons = await offerHelpers.getAllCoupons()
  res.render('admin/coupons', { title: " | Admin", admin: true, coupons })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/add-coupon', verifyLogin, async (req, res) => {
  try{
  res.render('admin/add-coupon', { title: " | Admin", admin: true,  "couponErr":req.session.adminCouponErr })
  req.session.adminCouponErr=false
   }catch(err){
    res.status('404').json(err)
  }
})

router.post('/add-coupon', verifyLogin, async (req, res) => {
  try{
  offerHelpers.createCoupon(req.body).then(() => {
    res.redirect('/admin/coupons')
  }).catch((err)=>{
    req.session.adminCouponErr=err
    res.redirect('/admin/add-coupon')
  })
   
}catch(err){
    res.status('404').json(err)
  }
})

router.get('/edit-coupon/:id', verifyLogin, async (req, res) => {
  try{
  let couponId = req.params.id
  let coupon = await offerHelpers.getCoupon(couponId)
  res.render('admin/coupon-edit', { title: " | Admin", admin: true, coupon, "couponErr":req.session.adminCouponErr })
  req.session.adminCouponErr=false
   }catch(err){
    res.status('404').json(err)
  }
})

router.post('/edit-coupon/:id', verifyLogin, async (req, res) => {
  try{
  let couponId = req.params.id
  offerHelpers.editCoupon(req.body, couponId).then(() => {
    res.redirect('/admin/coupons')
  }).catch((err)=>{
    req.session.adminCouponErr=err
    res.redirect(`/admin/edit-coupon/${couponId}`)
  })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/coupon-enable/:id', verifyLogin, async (req, res) => {
  try{
  offerHelpers.enableCoupon(req.params.id).then((response) => {
    res.json({ status: true })
  })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/coupon-disable/:id', verifyLogin, async (req, res) => {
  try{
  offerHelpers.disableCoupon(req.params.id).then((response) => {
    res.json({ status: true })
  })
   }catch(err){
    res.status('404').json(err)
  }
})

router.get('/delete-coupon/:id', verifyLogin, async (req, res) => {
  try{
  console.log('delete vann');
  offerHelpers.deleteCoupon(req.params.id).then((response) => {
    res.json({ status: true })
  })
   }catch(err){
    res.status('404').json(err)
  }
})

module.exports = router;
