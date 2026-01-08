var express = require("express");
const nodemailer = require("nodemailer");
var exe = require("../conn");
const { compile } = require("ejs");
var router = express.Router();

router.get("/", async function (req, res) {

    var sql = `SELECT * FROM sliders`;
    var sliders = await exe(sql);

    var sql2 = `SELECT * FROM category WHERE category_status = 'active'`;
    var categories = await exe(sql2);

    var sql3 = `SELECT * FROM products,product_variations WHERE products.product_id = product_variations.product_id AND products.is_highlighted = 'Yes'`;
    var bestDeals = await exe(sql3);

    var sql4 = `SELECT * FROM products,product_variations WHERE products.product_id = product_variations.product_id AND products.is_most_selling = 'Yes'`;
    var mostSelling = await exe(sql4);

    var packet = { sliders, categories, bestDeals, mostSelling };
    res.render("user/index.ejs", packet);
});

router.get("/products", async function (req, res) {
  var category_id = req.query.category_id;
  var cond = "";

  if (category_id) {
    if (!Array.isArray(category_id)) {
      category_id = [category_id];
    }

    cond = " AND (" + category_id.map((id) => `products.category_id = ${id}`).join(" OR ") + ")";
  }

  var sql = `SELECT * 
                FROM products
                JOIN product_variations 
                ON products.product_id = product_variations.product_id
                WHERE 1=1 ${cond}`;
  var products = await exe(sql);

  var sql2 = `SELECT * FROM category WHERE category_status = 'active'`;
  var categories = await exe(sql2);

  var sql3 = `SELECT COUNT(*) AS total_products
                FROM products
                JOIN product_variations 
                ON products.product_id = product_variations.product_id
                WHERE 1=1 ${cond}`;
  var total_products = await exe(sql3);
  total_products = total_products[0].total_products;


  var url_data = { category_id: category_id || [] };
  var packet = { products, categories, url_data, total_products, req };

  res.render("user/products.ejs", packet);
});

router.get("/product_details/:product_id/:products_variation_id", async function(req, res) {
  var product_id = req.params.product_id;
  var products_variation_id = req.params.products_variation_id;

  var sql1 = `SELECT * FROM category WHERE category_status = 'active'`;
  var categories = await exe(sql1);

  var sql2 = `SELECT * FROM products WHERE product_id = ?`;
  var products = await exe(sql2, [product_id]);

  var sql3 = `SELECT * FROM product_variations WHERE product_id = ?`;
  var variation_list = await exe(sql3, [product_id]);

  var sql4 = `SELECT * FROM product_variations WHERE product_id = ? AND products_variation_id = ?`;
  var product_variation = await exe(sql4, [product_id, products_variation_id]);

  var sql5 = `SELECT * FROM product_descriptions WHERE product_id = ?`;
  var descriptions = await exe(sql5, [product_id]);

  var sql6 = `SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND products_variation_id = ? AND color = ?`;
  var cart = [];
  if (req.session.user_id) {
    cart = await exe(sql6, [req.session.user_id, product_id, products_variation_id, req.query.color]);
  }

  var sql7 = `SELECT * FROM product_files WHERE product_id = ?`;
  var products_photos = await exe(sql7, [product_id]);

  var sql8 = `SELECT * FROM product_specifications WHERE product_id = ?`;
  var specifications = await exe(sql8, [product_id]);

  var packet = { products, variation_list, product_variation, categories, i: 0, category_id: products[0]?.category_id || null, req, cart, products_photos, descriptions, specifications };

  res.render("user/product_details.ejs", packet);
});

router.get("/create_account",function(req,res){
  res.render("user/create_account.ejs");
});

router.post("/save_account", async function (req, res) {
  try {
    var data = req.body;
    var sql = `INSERT INTO users (first_name, last_name, email, phone, password, confirm_password, date_of_birth, newsletter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    var result = await exe(sql, [
      data.first_name,
      data.last_name,
      data.email,
      data.phone,
      data.password,
      data.confirm_password,
      data.date_of_birth,
      data.newsletter
    ]);

    res.redirect("/login");
  } catch (err) {
    res.send("Email id is already Exist");
  }
});

router.get("/login",function(req,res){
  var packet = { req };
  res.render("user/login.ejs", packet);
});

router.post("/login", async function(req,res){
  var data = req.body;
  var sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
  var result = await exe(sql,[data.email, data.password]);

  if(result.length > 0){
    // Save session data
    req.session.user_id = result[0].user_id;
    req.session.user_name = result[0].first_name + " " + result[0].last_name;
    req.session.user_email = result[0].email;
    req.session.user_phone = result[0].phone;

    // Redirect to home or custom redirect
    return res.redirect(data.redirect || "/");
  } else {
    // Redirect back to login with error message
    return res.redirect("/login?error=Invalid Email or Password");
  }
});

function checkLogin(req,res,next){
  if(req.session.user_id){
    next();
  }else{
    res.redirect("/login?redirect="+encodeURIComponent(req.url));
  }
}

router.get("/add_to_cart", checkLogin , async function(req,res){
  var user_id = req.session.user_id;
  var data = req.query;
  
  var sql = `SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND products_variation_id = ? AND color = ? `;
  var result = await exe(sql, [user_id, data.product_id, data.products_variation_id, data.color]);
  if(result.length > 0){
    var sql = `UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ? AND products_variation_id = ? AND color = ?`;
    var result = await exe(sql,[data.quantity, user_id, data.product_id, data.products_variation_id, data.color]);
  }
  else{
      var sql = `INSERT INTO cart (user_id, product_id, products_variation_id, color, quantity) VALUES (?,?,?,?,?)`;
      var result = await exe(sql,[user_id, data.product_id, data.products_variation_id, data.color, data.quantity]);
  }
  res.redirect("/product_details/"+data.product_id+"/"+data.products_variation_id);
});

router.get("/cart", checkLogin, async function (req, res) {
  var user_id = req.session.user_id;
  var sql = `SELECT * FROM cart, products, product_variations WHERE cart.product_id = products.product_id AND cart.products_variation_id = product_variations.products_variation_id AND cart.user_id = ? `;
  var carts = await exe(sql, [user_id]);
  var packet = { carts }
  res.render("user/cart.ejs", packet);
});

router.get("/remove_from_cart/:cart_id", checkLogin, async function (req, res) {
  var user_id = req.session.user_id;
  var cart_id = req.params.cart_id;
  var sql = `DELETE FROM cart WHERE cart_id = ? AND user_id = ?`;
  var result = await exe(sql, [cart_id, user_id]);
  res.redirect("/cart");
});

router.get("/increment_quantity/:cart_id", checkLogin, async function (req, res) {
  var cart_id = req.params.cart_id;
  var user_id = req.session.user_id;
  var sql = `UPDATE cart SET quantity = quantity + 1 WHERE cart_id = ? AND user_id = ?`;
  var result = await exe(sql, [cart_id, user_id]);

  var sql2 = `SELECT * FROM cart WHERE cart_id = ? AND user_id = ?`;
  var cart = await exe(sql2, [cart_id, user_id]);
  res.send(cart);
});

router.get("/decrement_quantity/:cart_id", checkLogin, async function(req,res){
  var user_id = req.session.user_id;
  var cart_id = req.params.cart_id;
  var sql = `UPDATE cart SET quantity = quantity - 1 WHERE cart_id = ? AND user_id = ? AND quantity > 1`;
  var result = await exe(sql, [cart_id, user_id]);

  var sql2 = `SELECT * FROM cart WHERE cart_id = ? AND user_id = ?`;
  var cart = await exe(sql2, [cart_id, user_id]);
  res.send(cart);
});

router.get("/checkout", checkLogin, async function (req, res) {
  var user_id = req.session.user_id;
  var sql = `SELECT * FROM cart,products,product_variations WHERE cart.user_id = ? AND cart.product_id = products.product_id AND cart.products_variation_id = product_variations.products_variation_id`;
  var checkouts = await exe(sql, [user_id]);
  var packet = { checkouts };
  res.render("user/checkout.ejs", packet);
});

router.post("/place_order",checkLogin, async function (req, res) {
  
  var sql = `SELECT sum(cart.quantity * product_variations.variation_price) as total_amount FROM cart, product_variations WHERE cart.user_id = ? AND cart.products_variation_id = product_variations.products_variation_id`;

  var total_amount = await exe(sql, [req.session.user_id]);

  var o = {};
  o['user_id'] = req.session.user_id;
  o['first_name'] = req.body.firstName;
  o['last_name'] = req.body.lastName;
  o['email'] = req.body.email;
  o['phone'] = req.body.phone;
  o['address'] = req.body.address;
  o['city'] = req.body.city;
  o['state'] = req.body.state;
  o['zipCode'] = req.body.zipCode;
  o['payment'] = req.body.payment;
  o['payment_status'] = 'pending';
  o['transction_id'] = '';
  o['notes'] = req.body.notes;
  o['total_amount'] = total_amount[0].total_amount;
  o['order_date'] = new Date().toLocaleDateString('en-CA');
  o['dispatch_date'] = '';
  o['deliver_date'] = '';
  o['return_date'] = '';
  o['refund_date'] = '';
  o['cancel_date'] = '';
  o['order_status'] = 'pending';

  var sql2 = `INSERT INTO orders (user_id, first_name, last_name, email, phone, address, city, state, zipCode, payment, payment_status, transction_id, notes, total_amount, order_date, dispatch_date, deliver_date, return_date, refund_date, cancel_date, order_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  var result = await exe(sql2, [o.user_id, o.first_name, o.last_name, o.email, o.phone, o.address, o.city, o.state, o.zipCode, o.payment, o.payment_status, o.transction_id, o.notes, o.total_amount, o.order_date, o.dispatch_date, o.deliver_date, o.return_date, o.refund_date, o.cancel_date, o.order_status]);

  var order_id = result.insertId;

  var cart = `SELECT cart.quantity AS product_quantity, products.product_id, products.product_name, product_variations.products_variation_id, product_variations.variation_title AS product_title, product_variations.variation_market_price AS product_market_price, product_variations.variation_price AS product_price, cart.color AS product_color FROM cart JOIN products ON cart.product_id = products.product_id JOIN product_variations ON cart.products_variation_id = product_variations.products_variation_id WHERE cart.user_id = ? `;
  var cart_data = await exe(cart, [req.session.user_id]);

  for(var i = 0; i < cart_data.length; i++)
  {

    var sql3 = `INSERT INTO order_products (order_id, user_id, product_id, products_variation_id, product_name, product_title, product_market_price, product_price, product_color, product_quantity, total_price) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    var p = {};
    p['order_id'] = order_id;
    p['user_id'] = req.session.user_id;
    p['product_id'] = cart_data[i].product_id;
    p['products_variation_id'] = cart_data[i].products_variation_id;
    p['product_name'] = cart_data[i].product_name;
    p['product_title'] = cart_data[i].product_title;
    p['product_market_price'] = cart_data[i].product_market_price;
    p['product_price'] = cart_data[i].product_price;
    p['product_color'] = cart_data[i].product_color;
    p['product_quantity'] = cart_data[i].product_quantity;
    p['total_price'] = Number(cart_data[i].product_price) * Number(cart_data[i].product_quantity);

    var result2 = await exe(sql3, [order_id, req.session.user_id, p.product_id, p.products_variation_id, p.product_name, p.product_title, p.product_market_price, p.product_price, p.product_color, p.product_quantity, p.total_price]);
  }

  var sql4 = `DELETE FROM cart WHERE user_id = ?`;
  var result3 = await exe(sql4, [req.session.user_id]);

  if(req.body.payment == 'online'){
    res.redirect("/pay_now/"+order_id);
  }
  else{
    res.redirect("/order_details/"+order_id);
  }
});

router.get("/pay_now/:order_id", checkLogin, async function (req, res) {
  var order_id = req.params.order_id;
  var sql = `SELECT * FROM orders WHERE order_id = ?`;
  var order = await exe(sql, [order_id]);
  var packet = { order };
  res.render("user/pay_now.ejs", packet);
});

router.post("/verify_payment/:order_id", checkLogin, async function (req, res) {
  var order_id = req.params.order_id;
  var sql = `UPDATE orders SET payment_status = 'paid', transction_id = ? WHERE order_id = ?`;
  var result = await exe(sql, [req.body.razorpay_payment_id, order_id]);
  res.redirect("/order_success");
});

router.get("/order_success", checkLogin, async function (req, res) {
  res.render("user/order_success.ejs");
});

router.get("/profile-orders", checkLogin, async function (req, res) {
   
  var sql = `SELECT * FROM orders WHERE user_id = ?`;
  var orders = await exe(sql, [req.session.user_id]);

  for(var i = 0; i < orders.length; i++)
  {
    var sql3 = `SELECT * FROM order_products,products WHERE order_products.order_id = ? AND order_products.product_id = products.product_id`;
    var order_products = await exe(sql3, [orders[i].order_id]);
    orders[i].products = order_products;
  }

  var packet = { orders };
  res.render("user/profile-orders.ejs", packet);

});
router.get("/profile", checkLogin ,async function (req, res) {
  var user_id = req.session.user_id;
  var sql = `SELECT * FROM users WHERE user_id = ?`;
  var user = await exe(sql, [user_id]);

  var sql2 = `SELECT COUNT(*) as total_orders FROM orders WHERE user_id = ?`;
  var total_orders = await exe(sql2, [user_id]);
  user[0].total_orders = total_orders[0].total_orders;

  var sql3 = `SELECT SUM(total_amount) as total_amount FROM orders WHERE user_id = ?`;
  var total_amount = await exe(sql3, [user_id]);
  user[0].total_amount = total_amount[0].total_amount;

  var sql4 = `SELECT *
                FROM orders AS o
                INNER JOIN order_products AS op ON o.order_id = op.order_id
                WHERE o.user_id = ?
                ORDER BY o.order_date ASC, o.order_id ASC`;
  var rows = await exe(sql4, [user_id]);

  let ordersGrouped = {};
  rows.forEach(row => {
    if (!ordersGrouped[row.order_id]) {
      ordersGrouped[row.order_id] = {
        ...row,
        products: []
      };
    }
    ordersGrouped[row.order_id].products.push({
      product_id: row.product_id,
      product_name: row.product_name,
      quantity: row.quantity,
      price: row.price
    });
  });

  let ordersArray = Object.values(ordersGrouped);

  var packet = { user, ordersArray };

  res.render("user/profile.ejs", packet );
});


router.get("/profile-edit", checkLogin ,async function (req, res) {
  var user_id = req.session.user_id;
  var sql = `SELECT * FROM users WHERE user_id = ?`;
  var user = await exe(sql, [user_id]);
  var packet = { user };
  res.render("user/profile-edit.ejs", packet);
});

router.post("/update_profile", checkLogin ,async function (req, res) {
  var data = req.body;
  var user_id = req.session.user_id;
  var sql = `UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, date_of_birth = ? WHERE user_id = ?`;
  var result = await exe(sql,[data.first_name, data.last_name, data.email, data.phone, data.date_of_birth, user_id]);
  res.redirect("/profile");
});

router.get("/profile-password", checkLogin , async function (req,res){
  var user_id = req.session.user_id;
  var sql = `SELECT * FROM users WHERE user_id = ?`;
  var user = await exe(sql, [user_id]);
  var packet = { user };
  res.render("user/profile-password.ejs", packet);
});

router.get("/profile-invoice", checkLogin ,async function (req, res){
  res.render("user/profile-invoice.ejs");
});

router.get("/profile-addresses", checkLogin , async function (req, res) {
  res.render("user/profile-addresses.ejs");
});

router.get("/wishlist", function (req, res) {
  res.render("user/wishlist.ejs");
});

router.get("/about",async function(req,res){

  var sql = `SELECT * FROM about`;
  var about = await exe(sql);

  var sql2 = `SELECT * FROM team_member;`;
  var team_members = await exe(sql2);

  var packet = { about, team_members };
  res.render("user/about.ejs", packet);
});

router.get("/contact",function(req,res){
  res.render("user/contact.ejs");
});

router.post("/save_contact", async function(req,res){
  var data = req.body;
  var sql = `INSERT INTO contact_us (first_name, last_name, email, phone, subject, message) VALUES (?,?,?,?,?,?)`;
  var result = await exe(sql,[data.first_name, data.last_name, data.email, data.phone, data.subject, data.message]);
  res.redirect("/contact");
});

router.get("/privacy", async function(req,res){
  var sql = `SELECT * FROM privacy_policy`;
  var privacy = await exe(sql);
  var packet = { privacy };
  res.render("user/privacy.ejs", packet);
});

router.get("/refund",function(req,res){
  res.render("user/refund.ejs");
});

router.get("/terms", async function(req,res){
  var sql = `SELECT * FROM terms_conditions`;
  var terms = await exe(sql);
  var packet = { terms };
  res.render("user/terms.ejs", packet);
});

router.get("/faq",function(req,res){
  res.render("user/faq.ejs");
});

const otpStore = {}; // temporary store for OTPs

router.get("/forgot-password", function(req,res){
  res.render("user/forgot-password.ejs", {error: null});
});

router.post("/forgot-password", async function(req, res) {
  const { email } = req.body;

  // Check if user exists
  const sql = `SELECT * FROM users WHERE email = ?`;
  const user = await exe(sql, [email]);

   if (user.length === 0) {
    return res.render("user/forgot-password.ejs", { error: "Email not found." });
  }

    // Generate OTP (6-digit, expires in 5 min)
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // Send OTP email
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "magarlalitnandkumar@gmail.com",
      pass: "llav nlmf gkrj mgrx", // Gmail App Password
    },
  });

    await transporter.sendMail({
    from: "'ElectroStore' <magarlalitnandkumar@gmail.com>",
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
  });

    res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
});

router.get("/verify-otp", function(req, res) {
  res.render("user/verify-otp.ejs", { email: req.query.email, error: null });
});

router.post("/verify-otp", function(req, res) {
  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.render("user/verify-otp.ejs", { email, error: "OTP expired. Please try again." });
  }

  if (Date.now() > otpStore[email].expires) {
    delete otpStore[email];
    return res.render("user/verify-otp.ejs", { email, error: "OTP expired. Please request again." });
  }

  if (otpStore[email].otp == otp) {
    delete otpStore[email];
    return res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);
  } else {
    return res.render("user/verify-otp.ejs", { email, error: "Invalid OTP. Try again." });
  }
});

router.get("/reset-password", function(req, res) {
  res.render("user/reset-password.ejs", { email: req.query.email, error: null });
});

router.post("/reset-password", async function(req, res) {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("user/reset-password.ejs", { email, error: "Passwords do not match." });
  }

  const sql = `UPDATE users SET password = ? WHERE email = ?`;
  await exe(sql, [password, email]);

  res.redirect("/login");
});



module.exports = router;
