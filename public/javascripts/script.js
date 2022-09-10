function addToCart(proId, stock, dPrice){
  let input = $('#sizes').find(":selected").val();
  let input1 = $('#single-size').text()

  if(stock<=0){
    document.getElementById(proId).style.display = "none";
  }else if(input==0){
    document.getElementById('size-select').style.display = "block";
  }else{
    document.getElementById('size-select').style.display = "none";
    if(input1){
      input=input1
    }
    console.log(input)
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'post',
      data:{
        dPrice: dPrice,
        size:input
      },
      success:(response)=>{
        if(response.status){
            let count=$('#cart-count').html()
            count=parseInt(count)+1
            $('#cart-count').html(count)
            document.getElementById('success-btn').style.visibility = "visible";
            setTimeout(()=>{
              document.getElementById('success-btn').style.visibility = "hidden";
            },1000)
        }
      }
    })
  }

  }

  function changeQuantity(cartId, proId, name, dPrice, count) {
    let quantity = parseInt(document.getElementById(proId).innerHTML)
    count = parseInt(count)

    $.ajax({
      url: '/change-product-quantity',
      method: 'post',
      data: {
        'cartId': cartId,
        'proId': proId,
        'count': count,
        'quantity': quantity,
        'subtotal': (quantity + count) * dPrice
      },
      success: (response) => {
        if (response.removeProduct) {
          // alert('The product is removed from cart')
          Swal.fire({
            title: 'Oops',
            text: "The product is removed from cart!",
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK!'
          }).then(() => {

            location.reload()
          })
        } else {
          console.log(response)
          let decimal = parseInt((quantity + count) * dPrice)
          let savePrice = parseFloat(response.actual_total - response.total)
          document.getElementById(proId).innerHTML = quantity + count
          document.getElementById(name).innerHTML = ' ₹' + decimal
          document.getElementById('total').innerHTML = response.total
          document.getElementById('actualTotal').innerHTML = response.actual_total
          document.getElementById('discount').innerHTML = ' ' + savePrice
        }
      }
    })
  }


  function removeFromCart(cartId, proId) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: '/remove-from-cart',
          method: 'post',
          data: {
            'cartId': cartId,
            'proId': proId
          },
          success: (response) => {
            location.reload()

          }
        })
      }
    })
  }

  function cancelCoupon(){
    $.ajax({
      url: '/cancel-coupon',
      method: 'get',
      success: (response) => {
        location.reload()
      }
    })
  }


  function CopyToClipboard(id)
{
var r = document.createRange();
r.selectNode(document.getElementById(id));
window.getSelection().removeAllRanges();
window.getSelection().addRange(r);
document.execCommand('copy');
window.getSelection().removeAllRanges();
}