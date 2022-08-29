
const { response } = require('express');
const express = require('express');
const productHelpers = require('../helpers/product-helpers');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers');
const paypal=require('./paypal')

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let categories = await productHelpers.getCategories()
  let products = await productHelpers.getAllProducts()
  let cartCount = null
  if (req.session.loggedIn) {
    if (req.session.user) {
      var user = req.session.user
      cartCount = await userHelpers.getCartCount(req.session.user._id)
      //Object.keys(products).length
      res.render('index', { user, index: true, products, categories, cartCount });
    } else {
      res.redirect('/admin')
    }
  } else {
    res.render('index', { products, index: true, categories, cartCount });
  }
});

router.get('/login', function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { title: '| Login', 'loginErr': req.session.loginErr });
    req.session.loginErr = false
  }
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response.user
    req.session.admin = response.admin
    res.redirect('/')
  }).catch((err) => {
    console.log(err)
    req.session.loginErr = err
    res.redirect('/login')
  })
})

router.get('/signup', function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/')
  } else {
    res.render('user/signup', { title: '| Signup', "signupErr": req.session.signupErr });
    req.session.signupErr = false
  }

});

router.post("/signup", (req, res) => {
  console.log(req.body)
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response)
    res.redirect('/login')
  }).catch((err) => {
    req.session.signupErr = err
    res.redirect('/signup')
  })
})

router.get('/product-details/:id', verifyLogin, async (req, res) => {
  let proId = req.params.id;
  let products = await productHelpers.getAllProducts()
  productHelpers.getProductDetails(proId).then(async (productDetails) => {
    console.log(productDetails.category);
    let cartCount = await userHelpers.getCartCount(req.session.user._id)
    res.setHeader('cache-control', 'no-store')
    res.render('user/product-details', { title: '| Product details', productDetails, user: req.session.user, cartCount, products });
  })
})

router.get('/cart', verifyLogin, async function (req, res, next) {
  req.session.orderAddress = false
  let categories = await productHelpers.getCategories()
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let total = 0
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(req.session.user._id)
  }
  console.log(total)
  res.render('user/cart', { title: ' | Cart', categories, user: req.session.user, products, total });
});

router.get('/add-to-cart/:id', verifyLogin, (req, res) => {
  console.log('api call')
  userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    res.status(200).json({ status: true });
    // res.redirect('/')
  })
})

router.post('/change-product-quantity', (req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.session.user._id)
    res.json(response)
  })
})

router.post('/remove-from-cart', verifyLogin, (req, res) => {
  userHelpers.removeFromCart(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/checkout', verifyLogin, async function (req, res, next) {
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  if (total) {
    res.render('user/checkout', {
      title: '| Checkout',
      total, user: req.session.user,
      'addressErr': req.session.addressErr,
      'orderAddress': req.session.orderAddress
    });
    req.session.addressErr = false
  }

});

router.post('/place-order', verifyLogin, async function (req, res, next) {

  let product = await userHelpers.getCartProducts(req.session.user._id)
  var products = 0
  var total = 0
  if (product.length > 0) {
    products = await userHelpers.getCartProductList(req.session.user._id)
    total = await userHelpers.getTotalAmount(req.session.user._id)
  }
  userHelpers.placeOrder(req.body, products, total).then(async (orderId) => {

    if (req.body['payment_method'] === 'COD') {      
      console.log('cod succsess')        //----------if cod
      res.json({ codSuccess: true })

    } else if (req.body['payment_method'] === 'Razorpay') {               //-----------if razorpay
      userHelpers.generateRazorpay(orderId, total).then((order) => {
        res.json({ order })
      }).catch((err) => {
        res.json({ status: false })
      })

    } else if (req.body['payment_method'] === 'Paypal') {  
      userHelpers.changePaymentStatus(orderId).then(() => {
        console.log('payment successfull')
        res.json({paypal:true});
      })                                                         
    
    } else {                                                              //--------------else case

      res.json({ status: false })
    }
  })

});

router.post("/api/orders", async (req, res) => {
  const order = await paypal.createOrder();
  res.json(order);
});


router.post("/api/orders/:orderId/capture", async (req, res) => {
  const { orderId } = req.params;
  const captureData = await paypal.capturePayment(orderId);
  res.json(captureData);
});

router.post('/deliver-here', verifyLogin, (req, res) => {
  let title = req.body.order_address
  req.session.orderAddress = title
  res.redirect('/checkout')
})

router.post('/verify-payment', verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then((response) => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment successfull')
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: '' })
  })
})

router.get('/order-success', verifyLogin, async function (req, res, next) {
  res.render('user/order-success', { title: '| Success', user: req.session.user })
});

router.get('/orders', verifyLogin, async function (req, res, next) {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { title: '| Orders', user: req.session.user, orders })
});


router.get('/account', verifyLogin, async function (req, res, next) {
  cartCount = await userHelpers.getCartCount(req.session.user._id)
  res.render('user/account', {
    title: '| Account',
    user: req.session.user,
    cartCount,
    'profileUpdateErr': req.session.profileUpdateErr,
    'pwd': req.session.pwdErr,
    'addressErr': req.session.addressErr
  })
  req.session.profileUpdateErr = false
  req.session.pwdErr = false
  req.session.addressErr = false
});



router.get('/cancel-order/:id', verifyLogin, (req, res) => {
  let orderId = req.params.id
  userHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/orders')
  })
})

router.post('/update-profile', verifyLogin, (req, res) => {
  let userId = req.session.user._id
  userHelpers.updateProfile(req.body, userId).then((user) => {
    req.session.user = user
    console.log('success')
    res.redirect('/account')
  }).catch((err) => {
    req.session.profileUpdateErr = err
    console.log(req.session.profileUpdateErr)
    res.redirect('/account')
  })
})

router.post('/update-address', verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.updateAddress(req.body, req.session.user._id).then((user) => {
    req.session.user = user
    res.redirect('/account')
  }).catch((err) => {
    req.session.addressErr = err
    res.redirect('/account')
  })
})

router.post('/update-address-checkout', verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.updateAddress(req.body, req.session.user._id).then((user) => {
    req.session.user = user
    res.redirect('/checkout')
  }).catch((err) => {
    req.session.addressErr = err
    res.redirect('/checkout')
  })
})

router.post('/update-password', verifyLogin, (req, res) => {
  console.log(req.body)
  userHelpers.updatePassword(req.body, req.session.user._id).then((response) => {
    res.redirect('/account')
  }).catch((err) => {
    req.session.pwdErr = err
    res.redirect('/account')
  })
})

router.get('/delete-address/:id', verifyLogin, (req, res) => {
  let title = req.params.id
  let userId = req.session.user._id
  userHelpers.deleteAddress(title, userId).then((user) => {
    req.session.user = user
    res.redirect('/account')
  })
})


router.get('/logout', verifyLogin, (req, res) => {
  req.session.loggedIn = false
  req.session.destroy()
  res.redirect('/')
})

router.get('/wishlist', verifyLogin, (req, res) => {
 
})


module.exports = router;