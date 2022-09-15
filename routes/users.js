const express = require('express');
const productHelpers = require('../helpers/product-helpers');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers');
const offerHelpers = require('../helpers/offer-helpers');
const orderHelpers = require('../helpers/order-helpers');
const paypal = require('../helpers/paypal')

/* ------------------------- Verify login middleware ------------------------ */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  try{
  let categories = await productHelpers.getCategories()
  let products = await productHelpers.getAllProducts()
  let cartCount = null
  if (req.session.loggedIn) {
    if (req.session.user) {
      console.log(`this is req ${req}`);
      var user = req.session.user
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      res.render('index', { user, index: true, products, categories, cartCount });
    } else {
      res.redirect('/admin')
    }
  } else {
    res.render('index', { products, index: true, categories, cartCount });
  }
   }catch(err){
   next(err)
  }
});

/* ------------------------------- User login ------------------------------ */
router.get('/login', function (req, res, next) {
  try{
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { title: '| Login', 'loginErr': req.session.loginErr });
    req.session.loginErr = false
  }
   }catch(err){
   next(err)
  }
});

router.post("/login", (req, res, next) => {
  try{
  userHelpers.doLogin(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response.user
    req.session.admin = response.admin
    res.redirect('/')
  }).catch((err) => {
    req.session.loginErr = err
    res.redirect('/login')
  })
   }catch(err){
   next(err)
  }
})

/* ------------------------------- User signup ------------------------------ */
router.get('/signup', function (req, res, next) {
  try{
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup', { title: '| Signup', "signupErr": req.session.signupErr });
    req.session.signupErr = false
  }
   }catch(err){
   next(err)
  }
});

router.post("/signup", (req, res, next) => {
  try{
  userHelpers.doSignup(req.body).then((response) => {
      res.redirect('/login')
  }).catch((err) => {
    req.session.signupErr = err
    res.redirect('/signup')
  })
   }catch(error){
    next(err)
  }
})

/* ------------------------- Single product details ------------------------- */
router.get('/product-details/:id', verifyLogin, async (req, res, next) => {
  try{
  let proId = req.params.id;
  let products = await productHelpers.getAllProducts()
  productHelpers.getProductDetails(proId).then(async (productDetails) => {
    let category = await offerHelpers.getOffer(productDetails.categoryId)

    if (category.offer?.isEnabled) {
      let offerPrice = parseInt((productDetails.actual_price / 100) * category.offer.percent)
      productDetails.discount_price = parseFloat(productDetails.actual_price - offerPrice)
    }
    let arr=productDetails.sizes
   let isMultipleSize= Array.isArray(arr)

    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.setHeader('cache-control', 'no-store')
    res.render('user/product-details', { title: '| Product details', productDetails, user: req.session.user, cartCount, products, category, isMultipleSize });
  })
   }catch(err){
   next(err)
  }
})

/* -------------------------------- User cart ------------------------------- */
router.get('/cart', verifyLogin, async function (req, res, next) {
  try{
    req.session.orderAddress = false
    let categories = await productHelpers.getCategories()
    let products = await userHelpers.getCartProducts(req.session.user._id)
    let coupons = await offerHelpers.getCoupons()
    let total = 0
    let actual_total = 0
    let couponAppiled = 0
    if (products.length > 0) {
      total = await userHelpers.getTotalAmount(req.session.user._id)
      actual_total = await userHelpers.getSubTotalAmount(req.session.user._id)
      if (req.session.couponAppiled) {
        if (req.session.couponAppiled.minimum_purchase <= total) {
          let amountOff = req.session.couponAppiled.amount_off
          couponAppiled = amountOff
          total = total - amountOff
        } else {
          req.session.couponErr = `Minimum purchase must be ${req.session.couponAppiled.minimum_purchase}`
          req.session.couponAppiled = false
        }
      }
    } else {
      req.session.couponAppiled = false
    }
    res.render('user/cart', { title: ' | Cart', categories, user: req.session.user, products, total, actual_total, coupons, couponAppiled, "couponErr": req.session.couponErr });
    req.session.couponErr = false
   }catch(err){
   next(err)
  }
});

/* --------------------------- Add product to cart -------------------------- */
router.post('/add-to-cart/:id', verifyLogin, (req, res, next) => {
  try{
  userHelpers.addToCart(req.params.id, req.session.user._id, req.body).then(() => {
    res.status(200).json({ status: true });
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

/* ------------------------- Change product quantity ------------------------ */
router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  try{
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.session.user._id)
      response.actual_total = await userHelpers.getSubTotalAmount(req.session.user._id)
      if (req.session.couponAppiled) {
        if (req.session.couponAppiled.minimum_purchase < response.total) {
          let amountOff = req.session.couponAppiled.amount_off
          response.total = response.total - amountOff
        } else {
          req.session.couponErr = `Minimum purchase must be ${req.session.couponAppiled.minimum_purchase}`
          req.session.couponAppiled = false
        }
      }
      res.json(response)
    })
   }catch(err){
   next(err)
  }
})

/* ------------------------ Remove product from cart ------------------------ */
router.post('/remove-from-cart', verifyLogin, (req, res, next) => {
  try{
  userHelpers.removeFromCart(req.body).then((response) => {
    res.json(response)
  })
   }catch(err){
   next(err)
  }
})

/* ------------------------------ Apply coupon ------------------------------ */
router.post('/apply-coupon', verifyLogin, async (req, res, next) => {
  try{
  console.log(req.body.coupon_code);
  offerHelpers.applyCoupon(req.body.coupon_code, req.session.user._id).then((appliedCoupon) => {
    req.session.couponAppiled = appliedCoupon
    console.log(req.session.couponAppiled);
    res.redirect('/cart')
  }).catch((err) => {
    req.session.couponErr = err
    res.redirect('/cart')
  })
   }catch(err){
   next(err)
  }
})

/* ------------------------------ cancel coupon ----------------------------- */
router.get('/cancel-coupon', verifyLogin, async (req, res, next) => {
  try{
    req.session.couponAppiled = false
    res.status('200').json('success')
   }catch(err){
   next(err)
  }
})

/* ----------------------------- Go to checkout ----------------------------- */
router.get('/checkout', verifyLogin, async function (req, res, next) {
  try{
    let userId=req.session.user._id
  let total = await userHelpers.getTotalAmount(userId)
  let userDetails = await userHelpers.getuserDetails(userId)
  if (req.session.couponAppiled) {
    if (req.session.couponAppiled.minimum_purchase <= total) {
      let amountOff = req.session.couponAppiled.amount_off
      total = total - amountOff
    } else {
      req.session.couponAppiled = false
    }
  }
  if (total) {
    req.session.total = total
    res.render('user/checkout', {
      title: '| Checkout',
      total, user: req.session.user,
      userDetails,
      'addressErr': req.session.addressErr,
      'orderAddress': req.session.orderAddress
    });
    req.session.addressErr = false
  }
   }catch(err){
   next(err)
  }

});

/* ----------------------- Update address in checkout ----------------------- */
router.post('/update-address-checkout', verifyLogin, (req, res, next) => {
  try{
  console.log(req.body)
  userHelpers.updateAddress(req.body, req.session.user._id).then((user) => {
    req.session.user = user
    res.redirect('/checkout')
  }).catch((err) => {
    req.session.addressErr = err
    res.redirect('/checkout')
  })
   }catch(err){
   next(err)
  }
})

/* ----------------------------- Deliver address ---------------------------- */
router.post('/deliver-here', verifyLogin, (req, res, next) => {
  try{
  let title = req.body.order_address
  req.session.orderAddress = title
  res.redirect('/checkout')
   }catch(err){
   next(err)
  }
})

/* ----------------------------- Place an order ----------------------------- */
router.post('/place-order', verifyLogin, async function (req, res, next) {
  try{
  let userId = req.session.user._id
  let product = await userHelpers.getCartProducts(userId)
  var products = 0
  var total = 0
  if (product.length > 0) {
    products = await userHelpers.getCartProductList(userId)
    total = await userHelpers.getTotalAmount(userId)
    if (req.session.couponAppiled) {
      let amountOff = req.session.couponAppiled.amount_off
      total = total - amountOff
      offerHelpers.addUsedCoupon(req.session.couponAppiled, userId, total)
    }
  }
  orderHelpers.placeOrder(req.body, products, total, userId).then(async (orderId) => {
    req.session.couponAppiled = false
    if (req.body['payment_method'] === 'COD') {                             //----------if cod
      console.log('cod succsess')
      res.json({ codSuccess: true })

    } else if (req.body['payment_method'] === 'Razorpay') {                 //-----------if razorpay
      orderHelpers.generateRazorpay(orderId, total).then((order) => {
        res.status('200').json({ order })
      }).catch((err) => {
        res.json({ status: false })
      })

    } else if (req.body['payment_method'] === 'Paypal') {                   //----------if paypal
      orderHelpers.changePaymentStatus(orderId).then(() => {
        console.log('payal successfull')
        res.json({ paypal: true });
      }).catch((err) => {
        res.json({ status: false })
      })

    } else if (req.body['payment_method'] === 'Wallet') {                    //----------if Wallet  
      orderHelpers.changePaymentStatus(orderId).then(() => {
        console.log('wallet successfull')
        res.json({ walletSuccess: true })
      }).catch((err) => {
        res.json({ status: false })
      })

    } else {                                                                //-----------else case
      res.json({ status: false })
    }
  }).catch((err) => {
    res.json({ status: false })
  })

   }catch(err){
   next(err)
  }

});

/* --------------------------- Paypal order create -------------------------- */
router.post("/api/orders", verifyLogin, async (req, res, next) => {
  try{
  paypal.createOrder(req.session.total).then((order)=>{
    res.json(order);
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
});

/* ------------------------- Paypal payment capture ------------------------- */
router.post("/api/orders/:orderId/capture", verifyLogin, async (req, res, next) => {
  try{
  const { orderId } = req.params;
  const captureData = await paypal.capturePayment(orderId);
  res.json(captureData);
   }catch(err){
   next(err)
  }
});

/* -------------------------- Payment verification -------------------------- */
router.post('/verify-payment', verifyLogin, (req, res, next) => {
  try{
  console.log(req.body)
  orderHelpers.verifyPayment(req.body).then((response) => {
    orderHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    }).catch((err)=>{res.json({ status: false, errMsg: '' })})
  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
   }catch(err){
   next(err)
  }
})

/* ------------------------------ Order success ----------------------------- */
router.get('/order-success', verifyLogin, async function (req, res, next) {
  try{
  res.render('user/order-success', { title: '| Success', user: req.session.user })
   }catch(err){
   next(err)
  }
});

/* ----------------------------- Get all orders ----------------------------- */
router.get('/orders', verifyLogin, async function (req, res, next) {
  try{
  let cartCount = await userHelpers.getCartCount(req.session.user._id)
  let orders = await orderHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { title: '| Orders', user: req.session.user, orders, cartCount })
   }catch(err){
   next(err)
  }
});

/* ---------------------------- User cancel order --------------------------- */
router.get('/cancel-order/:id', verifyLogin, (req, res, next) => {
  try{
  let orderId = req.params.id
  orderHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/orders')
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

/* ------------------------------ user account ------------------------------ */
router.get('/account', verifyLogin, async function (req, res, next) {
  try{
    let userId=req.session.user._id
  let cartCount = await userHelpers.getCartCount(userId)
  let userDetails = await userHelpers.getuserDetails(userId)
  let referrals = await offerHelpers.getReferrals()
  res.render('user/account', {
    title: '| Account',
    user: req.session.user,
    cartCount,
    userDetails,
    referrals,
    'profileUpdateErr': req.session.profileUpdateErr,
    'pwd': req.session.pwdErr,
    'addressErr': req.session.addressErr
  })
  req.session.profileUpdateErr = false
  req.session.pwdErr = false
  req.session.addressErr = false
   }catch(err){
   next(err)
  }
});

/* --------------------------- User profile update -------------------------- */
router.post('/update-profile', verifyLogin, (req, res, next) => {
  try{
  let userId = req.session.user._id
  userHelpers.updateProfile(req.body, userId).then((user) => {
    req.session.user = user
    res.redirect('/account')
  }).catch((err) => {
    req.session.profileUpdateErr = err
    res.redirect('/account')
  })
   }catch(err){
   next(err)
  }
})

/* --------------------------- User address update -------------------------- */
router.post('/update-address', verifyLogin, (req, res, next) => {
  try{
  console.log(req.body)
  userHelpers.updateAddress(req.body, req.session.user._id).then((user) => {
    req.session.user = user
    res.redirect('/account')
  }).catch((err) => {
    req.session.addressErr = err
    res.redirect('/account')
  })
   }catch(err){
   next(err)
  }
})

/* -------------------------- Update user password -------------------------- */
router.post('/update-password', verifyLogin, (req, res, next) => {
  try{
  userHelpers.updatePassword(req.body, req.session.user._id).then((response) => {
    res.redirect('/account')
  }).catch((err) => {
    req.session.pwdErr = err
    res.redirect('/account')
  })
   }catch(err){
   next(err)
  }
})

/* -------------------------- Delete user address -------------------------- */
router.get('/delete-address/:id', verifyLogin, (req, res, next) => {
  try{
  let title = req.params.id
  let userId = req.session.user._id
  userHelpers.deleteAddress(title, userId).then((user) => {
    req.session.user = user
    res.redirect('/account')
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

/* ------------------------------ User wishlist ----------------------------- */
// router.get('/wishlist', verifyLogin, async (req, res, next) => {
//   try{
//   let cartCount = await userHelpers.getCartCount(req.session.user._id)
//   let wishlist = await userHelpers.getWishlist(req.session.user._id)
//   res.render('user/wishlist', { title: '| Wishlist', user: req.session.user, cartCount, wishlist })
//    }catch(err){
//    next(err)
//   }
// })

/* --------------------------------- logout --------------------------------- */
router.get('/logout', verifyLogin, (req, res, next) => {
  try{
  req.session.loggedIn = false
  req.session.destroy()
  res.redirect('/')
   }catch(err){
   next(err)
  }
})

module.exports = router;