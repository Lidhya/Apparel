jQuery('#form1').validate({
    rules:{
      email:{
        required:true,
        email:true
      },
      password:{
        required:true,
        minlength:5
      }

    },
    messages:{
      email :{
        required:"Enter valid email address",
        email:"Enter valid email Id"
      },
      password:{
        required:"Password is required",
        minlength:"Atleast 5 character required"
        }
    },
    submitHandler:function(form){
      form.submit();
    }
  })

  jQuery('#form2').validate({
    rules:{
      fname:{
        required:true,
         normalizer: function(value) {
      // Note: the value of `this` inside the `normalizer` is the corresponding
      // DOMElement. In this example, `this` reference the `username` element.
      // Trim the value of the input
       return $.trim(value);
      }
      },

      email:{
        required:true,
        email:true
      },
      phone:{
        required:true,
        minlength:10,
        maxlength:10
      },
      password:{
        required:true,
        minlength:5
      }

    },
    messages:{
      fname:{
        required:"Name is required",
      },
      email:{
        required:"Email address is required",
        email:"Enter valid email address"
      },
      phone:{
        required:"Mobile number is required",
        minlength:"Should contain 10 numbers",
        maxlength:"Should contain only 10 numbers"
      },
      password:{
        required:"Password is required",
        minlength:"Atleast 5 character required"
        }
    },
    messages:{
      email :{
        required:"Enter valid email address",
        email:"Enter valid email Id"
      },
      password:{
        required:"Password is required",
        minlength:"Atleast 5 character required"
        }
    },
    submitHandler:function(form){
      form.submit();
    }
  })


   jQuery('#form3').validate({
    rules:{
      name:{
        required:true,
        maxlength:25,
        normalizer: function(value) {
     return $.trim(value);
    }
      },

      description:{
        required:true
      },
      category:{
        required:true
      },
      material_type:'required',
       actual_price:'required',
      discount_price:'required',
      sizes:'required',
      stock:'required',
      Image1: { required: true, extension: "jpe?g" },
      Image2: { required: true, extension: "jpe?g" },
      Image3: { required: true, extension: "jpe?g" }
    },
    submitHandler:function(form){
      form.submit();
    }
  })
  
  jQuery('#form-edit').validate({
    rules:{
       name:{
        required:true,
        maxlength:25
      },
      description:{
        required:true
      },
      category:{
        required:true
      },
      material_type:'required',
       actual_price:'required',
      discount_price:'required',
      sizes:'required',
      stock:'required',
    
    },
    submitHandler:function(form){
      form.submit();
    }
  })

    jQuery('#form5').validate({
    rules:{
      otp:{
        required:true,
        minlength:6,
        maxlength:6
      }

    },
    messages:{
      
      otp:{
        required:"OTP is required",
        minlength:"Should contain 6 numbers",
        maxlength:"Should contain only 6 numbers"
      }
    },
    submitHandler:function(form){
      form.submit();
    }
  })

  jQuery('#passwordForm').validate({
  rules: {
      password: {
          required: true,
          minlength: 5
      },
      new_password:{
          minlength: 5
      },
      confirm_password: {
          minlength: 5,
          equalTo: "#newPassword"
      }
  },
  messages:{
      confirm_password: {
        equalTo:"Enter the same value"
      }

  }
}); 

jQuery('#form-address-edit').validate({
    rules:{
       title:{
        required:true,
      },
      address:{
        required:true
      },
      city:{
        required:true
      },
      pincode:{
        required:true,
        minlength:6,
        maxlength:6
      },
      phone:{
        required:true,
        minlength:10,
        maxlength:10
      },
    
    },
    submitHandler:function(form){
      form.submit();
    }
  })

  jQuery('#coupon-apply').validate({
    rules: {
        coupon_code: {
            required: true,
        },
    },
    messages:{
        coupon_code: {
            required: 'Enter a coupon code',
        },
  
    }
  }); 