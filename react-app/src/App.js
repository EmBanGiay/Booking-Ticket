//import logo from './logo.svg';
import img_quet_qr from './quet_qr.PNG';
import React, { useReducer, useState, useEffect } from 'react';
import './App.css';
import $ from 'jquery';
import CurrencyInput from 'react-currency-input-field';
import { Buffer } from 'buffer';
const utils = require("../utils/utils");
var AES256 = require('aes-everywhere');
var MD5 = require('md5');

//Variables
var PAYONUSERNAME;
var PAYONPASSWORD;
var PAYONKEY;
var MERCHANTID;
var APPID;
const txt_form_QR1 = "1. Nếu đăng ký trên máy tính: Mở ứng dụng ngân hàng đã chọn -> Quét QR code -> Thanh toán.";
const txt_form_QR2 = "2. Nếu đăng ký trên điện thoại: Lưu ảnh QR code ở trên hoặc chụp screenshot màn hình -> Mở ứng dụng";
const txt_form_QR3 = "ngân hàng đã chọn -> Chọn thanh toán QR code -> Chọn ảnh QR code đã lưu -> Thanh toán.";
const txt_form_QR4 = "Sau khi thanh toán thành công, hệ thống sẽ gửi";
const txt_form_QR5 = "xác nhận kèm mã tham dự sự kiện qua tin nhắn Zalo hoặc đường Email (vui lòng kiểm tra thư mục Inbox hoặc Spam).";
const underQRText = "QR code có hiệu lực trong 24h. Nếu qua thời gian hiệu lực, vui lòng đăng ký lại từ đầu."
var txt_form_thongbao = "Email xác nhận & Tin nhắn ZNS sẽ được gửi trong vòng 5 phút";
var accessToken = '';//current access token  
var voucher;
var creatorEvent;//current Event from Creator
var totalInputPrice;
var XungHo;
var payonQRCode;
var eventId;//current Event Id
var voucherList;
var no_of_ticket = 1;
var ticket_price = 0;
var txt_loai_ve = "";
var collection_loai_ve = [];
var array_loai_ve = {};
var array_loai_ve_i = {};
const debugging = true;
var error_count = 0;
var error_log = "success!";
var Private;
var txt_QRBank_btn = "Lấy QR Code";
var eventName;
const serverDomain = utils.Server_Domain;

const formReducer = (state, event) => {
  return {
    ...state,
    [event.name]: event.value
  }
}

function App() {

  const [formData, setFormData] = useReducer(formReducer, {});
  const [submitting, setSubmitting] = useState(false);
  const [visible1, setVisible1] = useState(true);
  const [visible2, setVisible2] = useState(false);
  const [visible3, setVisible3] = useState(false);
  const [visible4, setVisible4] = useState(false);
  const [btn1Visible, setBtn1Visible] = useState(false);
  const [visible1_1, setVisible1_1] = useState(false);
  const [visible2_1, setVisible2_1] = useState(false);
  const [totalPrice, setPrice] = useState('');
  const [qrCode, setQRCode] = useState('');
  const [bank_url, setBankURL] = useState('');
  const [NoOfTicket, setNoOfTicket] = useState(1);
  const [TicketType, setTicketType] = useState();
  const [dataEnd, setdataEnd] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [visibleOption1, setvisibleOption1] = useState(false);
  const [visibleOption2, setvisibleOption2] = useState(false);
  const [QRBankenabled, setQRBankEnabled] = useState(true);

  //
  //Use
  //
  //set value onload
  useEffect(() => {
    //set icon ngân hàng
    setBankURL("https://www.ledr.com/colours/white.jpg");

    //Lấy ID của Event trên Creator từ URL
    const search = new URL(window.location).searchParams;
    eventId = search.get("eventId");
    Private = search.get("Private");

    if (debugging) {
      console.log("Event ID:")
      console.log(eventId);
    }

    Initialize()
      .then(tokenData => {
        accessToken = tokenData[0]["Token"]["AccessToken"];

        if (debugging) {
          console.log(`Scope: ${tokenData["scope"]}`);
          console.log(`Access Token: ${accessToken}`);
        }
      })
      .then(() => GetVouchers(eventId))
      .then(() => GetCurrentEvent(eventId))
      .then(creatorEventData => {
        creatorEvent = creatorEventData["data"];

        if (debugging) {
          console.log("Event: ");
          console.log(creatorEvent);
          // console.log("List vé:");
          // console.log(creatorEvent["Ticket_type"]);
        }
        array_loai_ve = creatorEvent["Ticket_type"].split('\n');
        for (let i = 0; i < array_loai_ve.length; i++) {
          array_loai_ve_i = array_loai_ve[i].split(',');
          let this_loai_ve = {
            "loai_ve": array_loai_ve_i[0],
            "gia": array_loai_ve_i[1]
          }
          collection_loai_ve.push(this_loai_ve);
        }
        setFormData({
          name: 'Ticket_type',
          value: collection_loai_ve[0].loai_ve
        })
        setTicketType(collection_loai_ve[0].loai_ve);
        txt_loai_ve = creatorEvent["txt_loai_ve"];

        //hiện câu hỏi
        if (eventId === "4246561000005522003") {
          setvisibleOption1(true);
          setvisibleOption2(true);
        }
        //đổi tên event
        eventName = creatorEvent["Event_name"];
        if (creatorEvent["Event_name"] === "Lunch & Learn: Hướng Chính Bắc Trong Hành Trình Trở Thành Nhà Lãnh Đạo Đích Thực") {
          eventName = "Lunch and Learn Hướng Chính Bắc Trong Hành Trình Trở Thành Nhà Lãnh Đạo Đích Thực";
        }
        if (creatorEvent["Event_name"] === "AIDay - Ứng dụng Ai chìa khóa kinh doanh - Bứt Phá !") {
          eventName = "AIDay";
        }
      })
      
      .then(() => GetPayon(creatorEvent["Payon"]["ID"]))
      .then(payonData => {
        if (debugging) {
          console.log("Payon: ");
          console.log(payonData);
        }

        PAYONUSERNAME = payonData["data"]["Payon_Username"];
        PAYONPASSWORD = payonData["data"]["Payon_Password"];
        PAYONKEY = payonData["data"]["Payon_Key"];
        MERCHANTID = payonData["data"]["Merchant_Id"];
        APPID = payonData["data"]["App_Id"];

        totalInputPrice = Number(creatorEvent["Ticket_Price"]) * NoOfTicket;
        //giảm n% cho early bird
        if (creatorEvent["Early_bird"] === "true") {
          totalInputPrice = totalInputPrice * (100 - creatorEvent["Discount_Value"]) / 100;
        }
        setEnabled(true);//enable nút +/-
        setPrice(totalInputPrice);

        setFormData({
          name: 'Price',
          value: totalInputPrice
        })
        setFormData({
          name: 'Number_of_Tickets',
          value: 1
        })
        setFormData({
          name: 'Merchant_Request_Id',
          //Data Type: Number
          value: Math.floor(Date.now() / 1000)
        })
        setFormData({
          name: 'Event_name',
          value: eventName
        })
        setFormData({
          name: 'Ticket_price',
          value: Number(creatorEvent["Ticket_Price"])
        })
        setFormData({
          name: 'Event_code',
          value: eventId
        })
        setFormData({
          name: 'Company',
          value: ''
        })
        setFormData({
          name: 'Address',
          value: ''
        })
        setFormData({
          name: 'Tax_code',
          value: ''
        })
        setFormData({
          name: 'Position',
          value: ''
        })
        setFormData({
          name: 'ZNS_ID',
          value: creatorEvent["ZNS_ID"]
        })
        setFormData({
          name: 'Zeptomail_ID',
          value: creatorEvent["Zeptomail_ID"]
        })
        // setFormData({
        //   name: 'Company_website',
        //   value: ''
        // })
        setFormData({
          name: 'Chay_radio',
          value: 'Không'
        })
        setFormData({
          name: 'Hoivien_radio',
          value: 'Không'
        })
        setFormData({
          name: 'LayHoaDon',
          value: false
        })
      })
      .catch(error => {
        console.error(error);
      })

  }, [""]);

 
  //
  //Handler
  //
  const handleChange = async (event) => {
    const isCheckBox = event.target.type === 'checkbox';

    if (event.target.name === 'LayHoaDon') {
      if (event.target.checked) {
        setVisible1_1(true);
        setdataEnd(!dataEnd);
      }
      else {
        setVisible1_1(false);
        setdataEnd(!dataEnd);
      }
    }

    if (event.target.name === 'bank') {
      if (event.target.value === "") {
        setBankURL("https://www.ledr.com/colours/white.jpg");
      }
      else {
        setBankURL("https://payment.vimo.vn/images/bank/favicon/" + event.target.value + ".png");
        if (!visible2_1) {
          setVisible2_1(!visible2_1);
        }
      }
    }

    setFormData({
      name: event.target.name,
      value: isCheckBox ? event.target.checked : event.target.value
    })
  }

  const voucherChange2 = async (event) => {

    //Lấy voucher từ tên voucher được truyền vào và gán vào object
    if (event.target.name === 'Voucher') {
      voucher = voucherList["data"].find(x => x.Voucher === event.target.value.toUpperCase());
      if (voucher !== undefined) {
        //Nếu có voucher
        //voucher = data.data[0];

        if (debugging) {
          console.log(voucher);
        }

        //voucher dùng cho 1 vé
        if (voucher["one_ticket_per_use"] === "true") {
          setEnabled(false);
          no_of_ticket = 1;
          setNoOfTicket(no_of_ticket);
          setFormData({
            name: 'Number_of_Tickets',
            value: no_of_ticket
          })
        }

        setFormData({
          name: event.target.name,
          value: event.target.value
        })
      } else {
        //Nếu k có voucher
        voucher = undefined;

        setFormData({
          name: event.target.name,
          value: ''
        })
      }

      //Tính số tiền phải trả sau khi đã áp dụng voucher
      CalculateDiscount(voucher);
    }
    if (event.target.name === 'Number_of_Tickets') {
      //Tính số tiền phải trả sau khi đã áp dụng voucher
      CalculateDiscount(voucher);

      setFormData({
        name: event.target.name,
        value: event.target.value
      })
    }

    //voucher sinh viên
    if (event.target.value.toUpperCase() === 'SV200') {
      collection_loai_ve = [{ loai_ve: 'Tham dự hội thảo', gia: '1000000' }];
      setTicketType('Tham dự hội thảo');
      ticket_price = collection_loai_ve.find(e => e.loai_ve === 'Tham dự hội thảo').gia;
      setFormData({
        name: 'Ticket_price',
        value: ticket_price
      })
      setFormData({
        name: 'Ticket_type',
        value: event.target.value
      })
      CalculateDiscount(voucher);
    }
  }

  const handleBlur = async (event) => {

    //setBtn1Visible(current => !current);

    //Lấy voucher từ tên voucher được truyền vào và gán vào object
    if (event.target.name === 'Voucher') {
      GetVoucher(event.target.value.toString().toUpperCase(), function (data) {
        if (data.code === 3000 && data.data.length === 1) {
          //Nếu có voucher
          voucher = data.data[0];

          if (debugging) {
            console.log(voucher);
          }

          setFormData({
            name: event.target.name,
            value: event.target.value
          })
        } else {
          //Nếu k có voucher
          voucher = undefined;

          setFormData({
            name: event.target.name,
            value: ''
          })
        }

        //Tính số tiền phải trả sau khi đã áp dụng voucher
        CalculateDiscount(voucher);
      });
    }
    if (event.target.name === 'Number_of_Tickets') {
      //Tính số tiền phải trả sau khi đã áp dụng voucher
      CalculateDiscount(voucher);

      setFormData({
        name: event.target.name,
        value: event.target.value
      })
    }

    /*setTimeout(() => {
        setBtn1Visible(current => !current);
    }, 1000);*/
  }

  const handleClick1 = async (e) => {
    e.preventDefault();

    var Validate = 0;//0 => pass
    var alert_msg = "Vui lòng nhập ";

    if (debugging) {
      console.log("Form Data:");
      console.log(formData);
    }

    if (formData["LayHoaDon"] === true) {
      if (formData["Company"] === '') {
        Validate = 1;
        alert_msg = alert_msg + "Tên công ty";
      }
      if (formData["Address"] === '') {
        if (Validate > 0) {
          alert_msg = alert_msg + ", ";
        }
        Validate = 1;
        alert_msg = alert_msg + "Địa chỉ";
      }
      if (formData["Tax_code"] === '') {
        if (Validate > 0) {
          alert_msg = alert_msg + ", ";
        }
        Validate = 1;
        alert_msg = alert_msg + "Mã số thuế";
      }
    }

    if (Validate === 1) {
      alert(alert_msg);
    }
    else {
      if (formData["LayHoaDon"] === true) {
        txt_form_thongbao = "Email xác nhận phương thức thanh toán sẽ được gửi trong vòng 5 phút";
        InsertNewTicketBooking(function (data) {
          if (debugging === true) {
            console.log('Insert response');
            console.log(data);
          }
        });
        setVisible1(current => !current);
        setVisible4(current => !current);
      }
      else {
        setVisible1(current => !current);
        if (totalInputPrice === 0) {
          setVisible4(current => !current);
          if (formData["Gender"] === "Nam") {
            XungHo = "anh";
          }
          else {
            XungHo = "chị"
          }
          InsertNewTicketBooking(function (data) {
            console.log('Insert response');
            console.log(data);
          });
        }
        else {
          setVisible2(current => !current);
        }
      }
    }
  }
  const handleClick2 = async (e) => {
    e.preventDefault();
    //lock button
    txt_QRBank_btn = "Đang xử lý";
    setQRBankEnabled(false);

    GenerateBankQRCode()
      .then(QRdata => {
        if (debugging) {
          console.log('QR Response:');
          console.log(QRdata);
        }
  
        payonQRCode = `data:image/png;base64,${QRdata["data"]["qrcode_image"]}`;
        setQRCode(payonQRCode);
  
        //toggle visibility
        setVisible2(current => !current);
        setVisible3(current => !current);
      })
      .then(() => InsertNewTicketBooking())
      .then(data => {
        if(debugging){
          console.log(data);
        }
      })
      .catch(error => {
        console.log(error);
      })
  }

  const handleClick3 = () => {
    if (!visible4) {
      setVisible4(!visible4);
    }
  };

  //Back to 1st Form
  const Redirect = () => {
    window.location.replace(`/app/?eventId=${eventId}`);
  }

  //Nút +/- ticket
  const incrementCount = () => {
    if (NoOfTicket < 100) {
      no_of_ticket++;
      setNoOfTicket(no_of_ticket);
      CalculateDiscount(voucher);
      setFormData({
        name: 'Number_of_Tickets',
        value: no_of_ticket
      })
    }
  }
  const decrementCount = () => {
    if (NoOfTicket > 1) {
      no_of_ticket--;
      setNoOfTicket(no_of_ticket);
      CalculateDiscount(voucher);
      setFormData({
        name: 'Number_of_Tickets',
        value: no_of_ticket
      })
    }
  }

  const onChangeRadio = async (event) => {
    setTicketType(event.target.value);
    ticket_price = collection_loai_ve.find(e => e.loai_ve === event.target.value).gia;
    setFormData({
      name: 'Ticket_price',
      value: ticket_price
    })
    setFormData({
      name: 'Ticket_type',
      value: event.target.value
    })
    CalculateDiscount(voucher);
  }

  //  
  //Function
  //
  function Initialize() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/server/${serverDomain}/getToken`,
        type: "post",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          console.log(error);
        }
      });
    });
  }

  function GetVoucher(_voucherName) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/server/${serverDomain}/getVoucher?coupon_name=${_voucherName}&access_token=${accessToken}`,
        type: "post",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      })
    });
  }

  //Get All Vouchers
  function GetVouchers(_eventId) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/server/${serverDomain}/getVouchers?access_token=${accessToken}&eventId=${_eventId}`,
        type: "post",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      })
    });
  }

  //Get Payon Info
  function GetPayon(_payonRecId) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/server/${serverDomain}/getPayon?payon_Id=${_payonRecId}&access_token=${accessToken}`,
        type: "post",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      })
    });
  }

  function GetCurrentEvent(_eventId) {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: `/server/${serverDomain}/getEvent?event_Id=${_eventId}&access_token=${accessToken}`,
        type: "post",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      });
    });
  }


  //Tính giá tiền sau khi discount
  function CalculateDiscount(_voucher) {
    // console.log(_voucher["Status"]);
    var Discount_by_ticket = 0;
    var discount_value;
    if (ticket_price === 0) {
      ticket_price = formData["Ticket_price"];
    }
    var normal_price = ticket_price * no_of_ticket;
    var Final_price = 0;
    // //discount theo số lượng vé
    // if(no_of_ticket >= 5 && no_of_ticket < 8)
    // {
    //   Discount_by_ticket=normal_price*10/100;
    // }
    // else if(no_of_ticket >= 8)
    // {
    //   Discount_by_ticket=normal_price*15/100;
    // }
    Final_price = normal_price - Discount_by_ticket;
    //giảm n% cho early bird
    if (creatorEvent["Early_bird"] === "true") {
      discount_value = creatorEvent["Discount_Value"];
      if (eventId === "4246561000004054003") {
        if (no_of_ticket >= 3) {
          discount_value = parseInt(creatorEvent["Discount_Value"]) + 20;
        }
      }
      Final_price = Final_price * (100 - discount_value) / 100;
    }
    //discount theo voucher
    if (voucher !== undefined) {
      var allow = 1;
      if (_voucher["Private"] === "true") {
        allow = 0;
      }
      if (Private === "true") {
        allow = 1;
      }
      if (_voucher["Status"] === 'Active' && _voucher["Use_time"] > 0 && allow === 1) {
        var Discount_by_voucher = 0;
        if (_voucher["Value_Type"] === 'Percent') {
          Discount_by_voucher = Final_price * _voucher["Effect_Value"] / 100;
        }
        else if (_voucher["Value_Type"] === 'Minus') {
          Discount_by_voucher = _voucher["Effect_Value"];
        }
        Final_price = Final_price - Discount_by_voucher;
        if (_voucher["Value_Type"] === 'Fixed Percent') {
          Discount_by_voucher = normal_price * _voucher["Effect_Value"] / 100;
          Final_price = normal_price - Discount_by_voucher;
        }
        if (debugging) {
          console.log(Final_price);
        }
      }
    }
    if (Final_price < 0) {
      Final_price = 0;
    }
    //
    totalInputPrice = Final_price;
    setPrice(totalInputPrice);
    setFormData({
      name: 'Price',
      value: totalInputPrice
    })
  }

  function InsertNewTicketBooking() {
    return new Promise((resolve, reject) => {
      //Tạo body
      var requestBody = {
        "data": {
          "Payment_Status": 'Waiting',
          "First_name": formData["First_name"],
          "Last_name": formData["Last_name"],
          "Mobile": formData["Mobile"],
          "Gender": formData["Gender"],
          "Ticket_type": formData["Ticket_type"],
          "Voucher": formData["Voucher"],
          "Email": formData["Email"],
          "Price": formData["Price"],
          "Ticket_Price": formData["Ticket_price"],
          "Merchant_Request_Id": formData["Merchant_Request_Id"],
          "Number_of_Tickets": formData["Number_of_Tickets"],
          "Event_name": formData["Event_name"],
          "Event_code": formData["Event_code"],
          "Payon_QR_String": payonQRCode,
          "Company": formData["Company"],
          "ZNS_ID": formData["ZNS_ID"],
          "Zeptomail_ID": formData["Zeptomail_ID"],
          "Address": formData["Address"],
          "Tax_code": formData["Tax_code"],
          "LayHoaDon": formData["LayHoaDon"],
          "Position": formData["Position"],
          // "Company_website": formData["Company_website"],
          "Chay_radio": formData["Chay_radio"],
          "Hoivien_radio": formData["Hoivien_radio"],
          "Error_count": error_count,
          "Error_log": error_log
        },
        "result": {
          "fields": [
            "ID", "First_name", "Last_name", "Payon_QR_String"
          ],
          "message": true,
          "tasks": true
        }
      };

      $.ajax({
        url: `/server/${serverDomain}/submitTicket?access_token=${accessToken}`,
        type: "post",
        data: JSON.stringify(requestBody),
        contentType: "application/json",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          console.log(error);
          error_log = error;
          while (error_count < 6) {
            InsertNewTicketBooking();
            error_count++;
          }
        }
      })
    });
  }

  function GenerateBankQRCode() {
    return new Promise((resolve, reject) => {
      //Basic Auth Encoding
      var baseEncode = Buffer.from(`${PAYONUSERNAME}:${PAYONPASSWORD}`).toString('base64');

      //Payload Info
      var requestPayload = {
        "service_type_code": "PAYNOW",
        "service_code": "PAYNOW_QRLOCALBANK_DYNAMIC",
        "method_code": "LOCALBANK",
        "merchant_id": parseInt(MERCHANTID),
        "merchant_request_id": formData["Merchant_Request_Id"].toString(),
        "amount": formData["Price"],
        "bank_code": formData["bank"],
        "description": formData["Event_name"],
        "currency": "VND",
        "url_redirect": "google.com.vn",
        "url_notify": "https://ticket-booking-4-1-812297888.catalystserverless.com/server/ticket_booking_4_1_function/webhook",
        "url_cancel": "google.com.vn",
        "customer_fullname": `${formData["First_name"]} ${formData["Last_name"]}`,
        "customer_email": formData["Email"],
        "customer_mobile": formData["Mobile"]
      }

      if (debugging) {
        console.log("Payload");
        console.log(requestPayload);
      }

      //Encrypting Payload
      var encryptedRequestPayload = Encryption(JSON.stringify(requestPayload));

      //MD5 Encrypting
      var md5RequestPayload = MD5(`${APPID}${encryptedRequestPayload}${PAYONKEY}`);

      //Body to send to Payon
      var requestBody = {
        "app_id": APPID,
        "data": encryptedRequestPayload,
        "checksum": md5RequestPayload
      }

      if (debugging) {
        console.log("Body")
        console.log(requestBody);
      }

      $.ajax({
        url: `/server/${serverDomain}/createBankQRCode?base_encode=${baseEncode}`,
        type: "post",
        data: JSON.stringify(requestBody),
        contentType: "application/json",
        success: function (data) {
          resolve(data);
        },
        error: function (error) {
          reject(error);
        }
      })
    });
  }

  //Encrypt AES 256
  function Encryption(_inputStr) {
    return AES256.encrypt(_inputStr, PAYONKEY);
  }

  return (
    <div className="wrapper">
      {submitting &&
        <div>
          You are submitting the following:
          <ul>
            {Object.entries(formData).map(([name, value]) => (
              <li key={name}><strong>{name}</strong>:{value.toString()}</li>
            ))}
          </ul>
        </div>
      }
      {/* form đăng ký */}
      <div id='form-1' className={visible1 ? 'element-visible' : 'element-hidden'}>
        <form onSubmit={handleClick1}>
          <div class="NameDiv">
            <div className='Firstname_div'>
              <input className='left' type="text" name="First_name" required onChange={handleChange} />
              <span data-end="*">Họ & đệm</span>
            </div>
            <div className='Lastname_div'>
              <input className='right' type="text" name="Last_name" required onChange={handleChange} />
              <span className="spanTen" data-end="*">Tên</span>
            </div>
          </div>
          <div class="inputBox">
            <input type="text" name="Mobile" required onChange={handleChange} />
            <span data-end="*">Mobile</span>
          </div>
          <div class="inputBox" style={{ marginBottom: "22px" }}>
            <input type="text" name="Email" required onChange={handleChange} />
            <span data-end="*">Email</span>
          </div>
          <div class="inputBox3" style={{ marginBottom: "45px" }}>
            <label for="Company" className="label1" ><span className={dataEnd ? 'span1' : 'span2'} data-end="*">Tên Công ty</span><span style={{ marginLeft: "120px" }}>Vị trí</span></label>
            <input id="Company" className='input1' type="text" name="Company" onChange={handleChange} />
            <select id="Position" className='input2 padding7' name="Position" onChange={handleChange}>
              <option value=""></option>
              <option value="C-Level">C-Level</option>
              <option value="Manager">Manager</option>
              <option value="Executive">Executive</option>
              <option value="Student">Student</option>
            </select>
          </div>
          {/* <div class="inputBox2" style={{marginBottom: "45px"}}>
                <span>Website công ty</span>
                  <input type="text" name="Company_website" onChange={handleChange}/>
              </div> */}
          {/* <span className='txt_span'><input style={{marginBottom: "5px"}} type="checkbox" id="LayHoaDon" name="LayHoaDon" value="Lấy hoá đơn" onChange={handleChange}/>
                      <label for="LayHoaDon">Lấy hoá đơn</label></span> */}
          <div className={visible1_1 ? 'element-visible' : 'element-hidden'}>
            <div class="inputBox2" style={{ marginBottom: "40px" }}>
              <span data-end="*">Địa chỉ</span>
              <input type="text" name="Address" onChange={handleChange} />
            </div>
            <div class="inputBox2" style={{ marginBottom: "45px" }}>
              <span data-end="*">Mã số thuế</span>
              <input type="text" name="Tax_code" onChange={handleChange} />
            </div>
          </div>
          <div class="gender">
            <label class="label_gender" data-end="*">Giới tính</label>
            <input type="radio" id="nam" name="Gender" value="Nam" onChange={handleChange} required />
            <label for="nam">Nam</label>
            <input type="radio" id="nu" name="Gender" value="Nữ" onChange={handleChange} />
            <label for="nu">Nữ</label>
          </div>
          <div className={`chay ${visibleOption1 ? 'element-visible' : 'element-hidden'}`}>
            <label class="label_chay">Anh/Chị có ăn chay không?</label>
            <input type="radio" id="Co" name="Chay_radio" value="Có" onChange={handleChange} />
            <label class="label_radio_chay" for="Co">Có</label>
            <input type="radio" id="Khong" name="Chay_radio" value="Không" onChange={handleChange} />
            <label class="label_radio_chay" for="Khong">Không</label>
          </div>
          <div className={`gender ${visibleOption2 ? 'element-visible' : 'element-hidden'}`}>
            <label class="label_chay">Anh/Chị là Hội Viên CSMO?</label>
            <input type="radio" id="Co2" name="Hoivien_radio" value="Có" onChange={handleChange} />
            <label class="label_radio_chay" for="Co2">Có</label>
            <input type="radio" id="Khong2" name="Hoivien_radio" value="Không" onChange={handleChange} />
            <label class="label_radio_chay" for="Khong2">Không</label>
          </div>
          <div className={`row ${enabled ? 'enabled' : 'disabled'}`}>
            <div className='column1'>
              {/* <span className='txt_span'>{txt_loai_ve}</span> */}
              <div class="radio_loaive">
                {collection_loai_ve.map((option) => (
                  <span>
                    <input type="radio" name="Ticket_type" checked={TicketType === option.loai_ve} value={option.loai_ve} onChange={onChangeRadio} /> {option.loai_ve}
                    <br></br>
                  </span>
                ))}
              </div>
              <div class="Voucher">
                <span>Voucher</span>
                <input type="text" name="Voucher" onChange={voucherChange2} />
              </div>
            </div>
            <div className='column2'>
              <div class="ticket-group">
                <input className='element-hidden' type="number" name="Number_of_Tickets" value={NoOfTicket} required min="1" />
                <button type='button' className='vertical-btn' onClick={incrementCount}>˄</button>
                <div><span className='ticket'>{NoOfTicket}</span><span className='Ve'>Vé</span></div>
                <button type='button' className='vertical-btn' onClick={decrementCount}>˅</button>
              </div>
            </div>
          </div>
          <div class="inputBox2" style={{ marginBottom: "40px" }}>
            <span>Thành tiền</span>
            <CurrencyInput suffix=" đ" disabled className='Currency' name="Price" value={totalPrice} onChange={handleChange} />
          </div>
          <div class="btn_group">
            <input hidden={btn1Visible} class="btn-grad" type="submit" value="Đăng ký" />
          </div>
        </form>
      </div>
      {/* form chọn ngân hàng */}
      <div className={`formBank ${visible2 ? 'element-visible' : 'element-hidden'} ${QRBankenabled ? 'enabled' : 'disabled'}`}>
        <form onSubmit={handleClick2}>
          <p>Số tiền phải thanh toán là {totalPrice} VNĐ</p>
          <p>Vui lòng chọn ngân hàng bạn sẽ sử dụng để thanh toán QR payment, sau đó bấm nút "Lấy QR code"</p>
          <label for="bank">Ngân hàng  </label>
          <img src={bank_url} alt="Icon" width="35px" height="35px" />
          <select className='select_bank' name="bank" id="bank" onChange={handleChange} required>
            <option value=""></option>
            <option value="ABB">ABB - NH TMCP An Bình</option>
            <option value="ACB">ACB - NH TMCP Á Châu</option>
            <option value="AGB">AGB - NH Nông nghiệp và Phát triển Nông thôn Agribank</option>
            <option value="BAB">BAB - NH TMCP Bắc Á</option>
            <option value="BIDV">BIDV - NH Đầu tư và Phát triển Việt Nam</option>
            <option value="BVB">BVB - NH TMCP Bảo Việt</option>
            <option value="EXB">EXB - NH TMCP Xuất Nhập Khẩu</option>
            <option value="HDB">HDB - NH TMCP Phát Triển TPHCM</option>
            <option value="ICB">ICB - NH TMCP Công Thương Vietinbank</option>
            <option value="MB">MB - NH TMCP Quân Đội</option>
            <option value="MSB">MSB - NH TMCP Hàng Hải</option>
            <option value="NAB">NAB - NH TMCP Nam Á</option>
            <option value="NCB">NCB - NH TMCP Quốc Dân</option>
            <option value="OCB">OCB - NH TMCP Phương Đông Việt Nam</option>
            <option value="OJB">OJB - NH Thương mại TNHH MTV Đại Dương</option>
            <option value="PVB">PVB - NH TMCP Đại Chúng Việt Nam</option>
            <option value="SCB">SCB - NH TMCP Sài Gòn</option>
            <option value="SEA">SEA - NH TMCP Đông Nam Á</option>
            <option value="SGB">SGB - NH TMCP Sài Gòn Công Thương</option>
            <option value="SHB">SHB - NH TMCP Sài Gòn - Hà Nội</option>
            <option value="SHBKV">SHBKV - NH TNHH MTV Shinhan Việt Nam</option>
            <option value="TCB">TCB - NH TMCP Kỹ Thương Techcombank</option>
            <option value="TPB">TPB - NH TMCP Tiên Phong</option>
            <option value="VB">VB - NH TMCP Việt Nam Thương Tín</option>
            <option value="VPB">VPB - NH TMCP Việt Nam Thịnh Vượng</option>
            <option value="STB">STB - NH TMCP Sài Gòn Thương Tín, Sacombank</option>
            <option value="VCB">VCB - NH TMCP Ngoại Thương Việt Nam, Vietcombank</option>
          </select>
          <div className={`btn_group ${visible2_1 ? 'element-visible' : 'element-hidden'}`}>
            <input type='submit' class="btn-grad" value={txt_QRBank_btn} />
          </div>
        </form>
      </div>

      {/* form QR code */}
      <div className={`formQR ${visible3 ? 'element-visible' : 'element-hidden'}`}>
        <p>{underQRText}</p>
        <img alt="qr" width="300" height="300" src={qrCode} />
        <div className='txt_group'>
          <img src={img_quet_qr} alt="huong_dan_quet_qr" />
          <h5>{txt_form_QR4}</h5>
          <h5>{txt_form_QR5}</h5>
        </div>
        <button class='btn-back' onClick={Redirect}>Trở về trang đăng ký</button>
      </div>

      {/* form thông báo thành công */}
      <div className={`formThongBao ${visible4 ? 'element-visible' : 'element-hidden'}`}>
        <img alt="ok_icon" src='https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Eo_circle_green_white_checkmark.svg/2048px-Eo_circle_green_white_checkmark.svg.png' width="80px" height="80px"></img>
        <h2 class='green'>Đăng ký thành công</h2>
        <h3>Cảm ơn {XungHo} {formData["Last_name"]} đã đăng ký sự kiện {formData["Event_name"]}</h3>
        <h4>{txt_form_thongbao}</h4>
        {/* <button class='btn-back' onClick={Redirect}>Trở về trang đăng ký</button> */}
      </div>

    </div>
  );
}

export default App;