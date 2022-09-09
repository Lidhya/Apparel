$( document ).ready(function() {

    let walletBalance = parseInt(document.getElementById('wallet-balance').innerText)
     let total = parseInt(document.getElementById('total').innerText)
     if (walletBalance < total) {
       document.getElementById('wallet').classList.add('d-none')
       document.getElementById('wallet-status').innerText = ' (insufficient balance)'
     }
     
   $('button.update-address-btn').click(function () {
     $('form.update-address-form').submit();
   });
 
   $("#checkout-form").submit((e) => {
     $.ajax({
       url: '/place-order',
       method: 'post',
       data: $("#checkout-form").serialize(),
       success: (response) => {
         if (response.codSuccess) {
           location.href = '/order-success'
         } else if (response.walletSuccess) {
           location.href = '/order-success'
         }
         else if (response.order) {
           razorpayPayment(response.order)
 
         } else if (response.paypal) {
           console.log('successssss')
           location.href = '/order-success'
 
         } else {
           Swal.fire({
             title: 'Something went wrong!',
             text: "Please try again",
             icon: 'warning',
             confirmButtonColor: '#3085d6',
             confirmButtonText: 'OK!'
           }).then(() => {
             location.href = '/cart'
           })
         }
       }
     })
   })
 
   function razorpayPayment(order) {
     var options = {
       "key": "rzp_test_2GzGro7H4ySHD3", // Enter the Key ID generated from the Dashboard
       "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
       "currency": "INR",
       "name": "Apparel",
       "description": "Test Transaction",
       "image": "https://example.com/your_logo",
       "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
       "handler": function (response) {
 
         verifyPayment(response, order)
       },
       "prefill": {
         "name": "Gaurav Kumar",
         "email": "gaurav.kumar@example.com",
         "contact": "9999999999"
       },
       "notes": {
         "address": "Razorpay Corporate Office"
       },
       "theme": {
         "color": "#eaeaea"
       }
     };
 
     var rzp1 = new Razorpay(options);
     rzp1.open();
     rzp1.on('payment.failed', function (response) {
       alert('something went wrong')
       location.href = "/cart";
     })
 
   }
 
   function verifyPayment(payment, order) {
     $.ajax({
       url: '/verify-payment',
       method: 'post',
       data: {
         payment,
         order
       },
       success: (response) => {
         if (response.status) {
           location.href = '/order-success'
         } else {
           alert('payment failed')
         }
       }
     })
   }
 
 });
 
 
  function displaycheckout() {
     var element = document.getElementById("paypal-button-container");
     var checkout = document.getElementById("checkout-btn");
     element.classList.add("d-none");
     checkout.classList.remove("d-none");
  }
 
   function displayPaypal() {
      var element = document.getElementById("paypal-button-container");
     var checkout = document.getElementById("checkout-btn");
     element.classList.remove("d-none");
     checkout.classList.add("d-none");
   }
 