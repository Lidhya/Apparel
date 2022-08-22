require('dotenv').config()
var express = require('express');
var router = express.Router();
var userHelpers=require('../helpers/user-helpers')

const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const crypto = require('crypto');
const smsKey = process.env.SMS_SECRET_KEY;
const twilioNum = process.env.TWILIO_PHONE_NUMBER;

const verifyLogin=(req,res,next)=>{
	if(req.session.loggedIn){
		res.redirect('/')
	}else{
	  next()
   }
  }

router.get('/',verifyLogin,(req,res)=>{
	res.setHeader('cache-control','no-store')
    res.render('user/otp-login',{"authErr":req.session.authErr})
	req.session.authErr=false
})
router.post('/sendOTP', verifyLogin,(req, res) => {
	res.setHeader('cache-control','no-store')
    userHelpers.otpLogin(req.body.phone).then((response)=>{
		const phone = `+91${req.body.phone}`
		const otp = Math.floor(100000 + Math.random() * 900000);
		const ttl = 5 * 60 * 1000;
		const expires = Date.now() + ttl;
		const data = `${phone}.${otp}.${expires}`;
		const hash = crypto.createHmac('sha256', smsKey).update(data).digest('hex');
		const fullHash = `${hash}.${expires}`;

		req.session.user=response.user
	
		client.messages
			.create({
				body: `Your One Time Login Password For Apparel is ${otp}. Will expire in 5 minutes.`,
				from: twilioNum,
				to: phone
			})
			.then((messages) => console.log(messages))
			.catch((err) => {
				console.error(err)
				err='something went wrong try again'
				req.session.authErr=err
				res.redirect('/otp')
			});
	
		
		// res.status(200).send({ phone, hash: fullHash, otp });  // this bypass otp via api only for development instead hitting twilio api all the time
		
		res.render('user/otp-confirm',{ phone, hash: fullHash });          // Use this way in Production
	}).catch((err)=>{
		req.session.authErr=err
		res.redirect('/otp')
	})
	
});

router.post('/verifyOTP',verifyLogin, (req, res) => {
	res.setHeader('cache-control','no-store')
	const phone = req.body.phone
	const hash = req.body.hash;
	const otp = req.body.otp;
	let [ hashValue, expires ] = hash.split('.');

	let now = Date.now();
	if (now > parseInt(expires)) {
		return ()=>{
			var err='Timeout. Please try again'
			req.session.authErr=err
			res.redirect('/otp')
			//res.status(504).send({ msg: 'Timeout. Please try again' })
		}
	}
	let data = `${phone}.${otp}.${expires}`;
	let newCalculatedHash = crypto.createHmac('sha256', smsKey).update(data).digest('hex');
	if (newCalculatedHash === hashValue) {
		console.log('user confirmed');
        req.session.loggedIn=true
        req.session.user
        res.redirect('/')
	} else {
		console.log('not authenticated');
		var err='Incorrect OTP' 
		req.session.authErr=err
		return res.redirect('/otp')
	}
});

module.exports = router;