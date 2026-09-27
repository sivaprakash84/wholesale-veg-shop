const nodemailer = require("nodemailer");


// ============================================
// EMAIL TRANSPORTER
// ============================================

const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });


// ============================================
// SEND ORDER EMAIL
// ============================================

const sendOrderConfirmationEmail = async (order) => {

  try {

    const customerEmail =
      order.customer.email;

    if (!customerEmail) {
      console.log(
        "No customer email found. Email not sent."
      );

      return;
    }


    // ========================================
    // ORDER ITEMS
    // ========================================

    const itemsHtml =
      order.items
        .map(
          (item) => `
            <tr>

              <td style="
                padding: 12px;
                border-bottom: 1px solid #eeeeee;
              ">
                ${item.name}
              </td>

              <td style="
                padding: 12px;
                border-bottom: 1px solid #eeeeee;
                text-align: center;
              ">
                ${item.quantity} ${getUnitLabel(item.unit)}
              </td>

              <td style="
                padding: 12px;
                border-bottom: 1px solid #eeeeee;
                text-align: right;
              ">
                ₹${Number(item.price).toFixed(2)}
              </td>

              <td style="
                padding: 12px;
                border-bottom: 1px solid #eeeeee;
                text-align: right;
                font-weight: 600;
              ">
                ₹${Number(item.total).toFixed(2)}
              </td>

            </tr>
          `
        )
        .join("");


    // ========================================
    // EMAIL HTML
    // ========================================

    const html = `

      <div style="
        margin: 0;
        padding: 30px 15px;
        background: #f4f7f5;
        font-family: Arial, Helvetica, sans-serif;
      ">

        <div style="
          max-width: 700px;
          margin: auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        ">


          <!-- HEADER -->

          <div style="
            padding: 28px;
            background: #176b3a;
            color: #ffffff;
            text-align: center;
          ">

            <h1 style="
              margin: 0;
              font-size: 26px;
            ">
              SAD Prakash Wholesale Vegetable Shop
            </h1>

            <p style="
              margin: 8px 0 0;
              font-size: 14px;
              opacity: 0.9;
            ">
              Wholesale Vegetable Ordering
            </p>

          </div>


          <!-- CONTENT -->

          <div style="
            padding: 30px;
            color: #263238;
          ">


            <h2 style="
              margin-top: 0;
              color: #176b3a;
            ">
              🎉 Thank you for your order!
            </h2>


            <p>
              Dear
              <strong>
                ${order.customer.name}
              </strong>,
            </p>


            <p>
              We have received your order successfully.
              Our team will review and confirm your order
              shortly.
            </p>


            <!-- ORDER SUMMARY -->

            <div style="
              margin-top: 25px;
              padding: 18px;
              background: #f5f9f6;
              border-radius: 8px;
            ">

              <h3 style="
                margin-top: 0;
                color: #176b3a;
              ">
                Order Details
              </h3>


              <p>
                <strong>Order ID:</strong>
                #${order.orderId}
              </p>


              <p>
                <strong>Order Date:</strong>
                ${new Date(
                  order.orderedAt
                ).toLocaleString("en-IN")}
              </p>


              <p>
                <strong>Order Status:</strong>
                ${order.orderStatus}
              </p>

            </div>


            <!-- ITEMS -->

            <h3 style="
              margin-top: 30px;
              color: #176b3a;
            ">
              Items Ordered
            </h3>


            <table style="
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            ">

              <thead>

                <tr style="
                  background: #176b3a;
                  color: #ffffff;
                ">

                  <th style="
                    padding: 12px;
                    text-align: left;
                  ">
                    Product
                  </th>

                  <th style="
                    padding: 12px;
                    text-align: center;
                  ">
                    Quantity
                  </th>

                  <th style="
                    padding: 12px;
                    text-align: right;
                  ">
                    Price
                  </th>

                  <th style="
                    padding: 12px;
                    text-align: right;
                  ">
                    Total
                  </th>

                </tr>

              </thead>


              <tbody>

                ${itemsHtml}

              </tbody>

            </table>


            <!-- PRICE -->

            <div style="
              margin-top: 20px;
              margin-left: auto;
              max-width: 300px;
            ">

              <p style="
                display: flex;
                justify-content: space-between;
              ">
                <span>Subtotal</span>
                <strong>
                  ₹${Number(order.subtotal).toFixed(2)}
                </strong>
              </p>


              <p style="
                display: flex;
                justify-content: space-between;
              ">
                <span>Delivery Charge</span>
                <strong>
                  ₹${Number(
                    order.deliveryCharge
                  ).toFixed(2)}
                </strong>
              </p>


              <hr />


              <p style="
                display: flex;
                justify-content: space-between;
                font-size: 18px;
                color: #176b3a;
              ">
                <strong>Total</strong>

                <strong>
                  ₹${Number(
                    order.total
                  ).toFixed(2)}
                </strong>
              </p>

            </div>


            <!-- CUSTOMER DETAILS -->

            <div style="
              margin-top: 30px;
              padding: 20px;
              background: #fafafa;
              border: 1px solid #eeeeee;
              border-radius: 8px;
            ">

              <h3 style="
                margin-top: 0;
                color: #176b3a;
              ">
                Delivery Details
              </h3>


              <p>
                <strong>Name:</strong>
                ${order.customer.name}
              </p>


              <p>
                <strong>Phone:</strong>
                ${order.customer.phone}
              </p>


              <p>
                <strong>Email:</strong>
                ${order.customer.email}
              </p>


              ${
                order.customer.shopName
                  ? `
                    <p>
                      <strong>Shop:</strong>
                      ${order.customer.shopName}
                    </p>
                  `
                  : ""
              }


              <p>
                <strong>Address:</strong>
                ${order.customer.address}
              </p>


              <p>
                <strong>City:</strong>
                ${order.customer.city}
              </p>


              <p>
                <strong>Pincode:</strong>
                ${order.customer.pincode}
              </p>


              ${
                order.delivery?.date
                  ? `
                    <p>
                      <strong>Delivery Date:</strong>
                      ${order.delivery.date}
                    </p>
                  `
                  : ""
              }


              ${
                order.delivery?.time
                  ? `
                    <p>
                      <strong>Delivery Time:</strong>
                      ${order.delivery.time}
                    </p>
                  `
                  : ""
              }


              ${
                order.delivery?.instructions
                  ? `
                    <p>
                      <strong>Instructions:</strong>
                      ${order.delivery.instructions}
                    </p>
                  `
                  : ""
              }

            </div>


            <!-- PAYMENT -->

            <div style="
              margin-top: 25px;
              padding: 18px;
              background: #fff8e8;
              border-radius: 8px;
            ">

              <h3 style="
                margin-top: 0;
                color: #8a6200;
              ">
                Payment
              </h3>


              <p>
                <strong>Payment Method:</strong>
                ${order.paymentMethod}
              </p>


              <p>
                <strong>Payment Status:</strong>
                ${order.paymentStatus}
              </p>

            </div>


            <!-- MESSAGE -->

            <p style="
              margin-top: 30px;
              line-height: 1.6;
            ">
              We will notify you when your order is
              confirmed and when it is ready for delivery.
            </p>


          </div>


          <!-- FOOTER -->

          <div style="
            padding: 22px;
            background: #f1f5f2;
            text-align: center;
            color: #66736b;
            font-size: 13px;
          ">

            <strong style="
              color: #176b3a;
            ">
              SAD Prakash Wholesale Vegetable Shop
            </strong>

            <br />

            Thank you for choosing us.

          </div>


        </div>

      </div>

    `;


    // ========================================
    // SEND EMAIL
    // ========================================

    const mailOptions = {
  from: `"SAD Prakash Wholesale Vegetable Shop" <${process.env.MAIL_USER}>`,

  replyTo: process.env.MAIL_USER,

  to: customerEmail,

  subject: `Order Confirmation - #${order.orderId}`,

  html,
};


    const transporter = createTransporter();
const info = await transporter.sendMail(mailOptions);


    console.log(
      "Order confirmation email sent:",
      info.messageId
    );


    return info;

  } catch (error) {

    console.error(
      "Order confirmation email error:",
      error
    );

    throw error;
  }
};


module.exports = {
  sendOrderConfirmationEmail,
};