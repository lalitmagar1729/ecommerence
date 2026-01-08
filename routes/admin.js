var express = require("express");
var exe = require("../conn");

var router = express.Router();

router.get("/", async function (req, res) {
  let dates = [];
  let total_amounts = [];

  for (let i = 6; i >= 0; i--) {
    let date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    dates.push(date);

    let sql = `SELECT SUM(total_amount) as total FROM orders WHERE DATE(order_date) = ?`;
    let result = await exe(sql, [date]);
    total_amounts.push(result[0].total || 0);
  }

  let totalUsersResult = await exe(`SELECT COUNT(*) as totalUsers FROM users`);
  let totalOrdersResult = await exe(`SELECT COUNT(*) as totalOrders FROM orders`);
  let totalProductsResult = await exe(`SELECT COUNT(*) as totalProducts FROM products`);

  let totalUsers = totalUsersResult[0].totalUsers;
  let totalOrders = totalOrdersResult[0].totalOrders;
  let totalProducts = totalProductsResult[0].totalProducts;

  let allOrdersResult = await exe(`SELECT
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) AS pendingOrders,
          COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) AS deliveredOrders,
          COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) AS cancelledOrders
        FROM orders
  `);
  let orderCounts = allOrdersResult[0];

  let userGrowthResult = await exe(`
    SELECT
      DATE(created_at) AS user_date,
      COUNT(*) AS new_users
    FROM users
    WHERE DATE(created_at) >= CURDATE() - INTERVAL 6 DAY
    GROUP BY DATE(created_at)
    ORDER BY user_date ASC
  `);

  let userGrowthDates = [];
  let userGrowthCounts = [];

  for (let i = 6; i >= 0; i--) {
    let date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    userGrowthDates.push(date);
      let sql = `SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?`;
      let result = await exe(sql, [date]);
      userGrowthCounts.push(result[0].count || 0);
  }

  

  let packet = { dates, total_amounts, totalUsers, totalOrders, totalProducts, orderCounts, userGrowthDates, userGrowthCounts };

  res.render("admin/index.ejs", packet);
});

router.get("/category", async function (req, res) {
  var sql = `SELECT * FROM category`;
  var result = await exe(sql);
  var packet = { result };
  res.render("admin/category.ejs", packet);
});

router.post("/save_category", async function (req, res) {
  if (req.files) {
    var filename = Date.now() + "_" + req.files.category_image.name;
    req.files.category_image.mv("public/uploads/category/" + filename);
  }
  var data = req.body;
  var sql = `INSERT INTO category (category_name, category_description, category_image, category_status) VALUES (?,?,?,?)`;
  var result = await exe(sql, [
    data.category_name,
    data.category_description,
    filename,
    data.category_status,
  ]);
  res.redirect("/admin/category");
});

router.get("/edit_category/:category_id", async function (req, res) {
  var category_id = req.params.category_id;
  var sql = `SELECT * FROM category WHERE category_id = ?`;
  var info = await exe(sql, [category_id]);
  var packet = { info };
  res.render("admin/edit_category.ejs", packet);
});

router.post("/update_category", async function (req, res) {
  var data = req.body;
  var sql = `UPDATE category SET category_name = ?, category_description = ?, category_status = ? WHERE category_id = ?`;
  var result = await exe(sql, [
    data.category_name,
    data.category_description,
    data.category_status,
    data.category_id,
  ]);
  if (req.files) {
    var filename = Date.now() + "_" + req.files.category_image.name;
    req.files.category_image.mv("public/uploads/category/" + filename);
    sql = `UPDATE category SET category_image = ? WHERE category_id = ?`;
    result = await exe(sql, [filename, data.category_id]);
  }

  res.redirect("/admin/category");
});

router.get("/products", async function (req, res) {
  var sql = `SELECT * FROM category WHERE category_status = 'active'`;
  var categories = await exe(sql);
  var packet = { categories };
  res.render("admin/products.ejs", packet);
});

router.post("/save_product", async function (req, res) {
  if (req.files) {
    var filename = Date.now() + "_" + req.files.product_main_image.name;
    req.files.product_main_image.mv("public/uploads/products/" + filename);
  }

  var data = req.body;
  var sql = `INSERT INTO products (category_id, product_name, product_brand, product_details, product_colors, product_main_image, is_highlighted, is_most_selling) VALUES (?,?,?,?,?,?,?,?)`;
  var result = await exe(sql, [
    data.category_id,
    data.product_name,
    data.product_brand,
    data.product_details,
    data.product_colors,
    filename,
    data.is_highlighted,
    data.is_most_selling,
  ]);
  res.redirect("/admin/products");
});

router.get("/products_list", async function (req, res) {
  var sql = `SELECT * FROM products`;
  var products = await exe(sql);
  var packet = { products };
  res.render("admin/products_list.ejs", packet);
});

router.get("/edit_product/:product_id", async function (req, res) {
  var product_id = req.params.product_id;
  var sql = `SELECT * FROM products WHERE product_id = ?`;
  var products = await exe(sql, [product_id]);
  var sql2 = `SELECT * FROM category WHERE category_status = 'active'`;
  var categories = await exe(sql2);
  var packet = { products, categories };
  res.render("admin/edit_product.ejs", packet);
});

router.post("/update_product", async function (req, res) {
  var data = req.body;
  var sql = `UPDATE products SET category_id = ?, product_name = ?, product_brand = ?, product_details = ?, product_colors = ?, is_highlighted = ?, is_most_selling = ? WHERE product_id = ?`;
  var result = await exe(sql, [
    data.category_id,
    data.product_name,
    data.product_brand,
    data.product_details,
    data.product_colors,
    data.is_highlighted,
    data.is_most_selling,
    data.product_id,
  ]);
  if (req.files) {
    var filename = Date.now() + "_" + req.files.product_main_image.name;
    req.files.product_main_image.mv("public/uploads/products/" + filename);
    sql2 = `UPDATE products SET product_main_image = ? WHERE product_id = ?`;
    result = await exe(sql2, [filename, data.product_id]);
  }
  res.redirect("/admin/products_list");
});

router.get("/add_product_variantions/:product_id", async function (req, res) {
  var product_id = req.params.product_id;
  var sql = `SELECT * FROM products WHERE product_id = ?`;
  var products = await exe(sql, [product_id]);

  sql = `SELECT * FROM product_variations WHERE product_id = ?`;
  var product_variations = await exe(sql, [product_id]);

  var packet = { products, product_variations };
  res.render("admin/add_product_variantions.ejs", packet);
});

router.get("/add_product_files/:product_id", async function(req,res){
  var product_id = req.params.product_id;

  var sql = `SELECT * FROM products WHERE product_id = ?`;
  var result = await exe(sql, [product_id]);

  var sql2 = `SELECT * FROM product_files WHERE product_id = ?`;
  var product_files = await exe(sql2, [product_id]);

  var packet = { result, product_files };
  
  res.render("admin/product_files.ejs", packet);
});

router.post("/save_product_files", async function (req, res) {
  var data = req.body;

  if (req.files && req.files.product_files) {
    var filename = Date.now() + "_" + req.files.product_files.name;
    await req.files.product_files.mv("public/uploads/product_files/" + filename);
  }

  var sql = `INSERT INTO product_files (product_id , product_file_type, product_files) VALUES (?,?,?)`;
  var result = await exe(sql, [data.product_id, data.product_file_type, filename]);

  res.redirect("/admin/add_product_files/" + data.product_id);
});

router.post("/save_product_variations", async function (req, res) {
  var data = req.body;
  var sql = `INSERT INTO product_variations (product_id, variation_title, variation_market_price, variation_price, available_stock) VALUES (?,?,?,?,?)`;
  var result = await exe(sql, [
    data.product_id,
    data.variation_title,
    data.variation_market_price,
    data.variation_price,
    data.available_stock,
  ]);
  res.redirect("/admin/add_product_variantions/" + data.product_id);
});

router.get("/edit_product_variation/:products_variation_id",  async function (req, res) {
    var products_variation_id = req.params.products_variation_id;
    var sql = `SELECT * FROM product_variations WHERE products_variation_id = ?`;
    var product_info = await exe(sql, [products_variation_id]);
    var sql2 = `SELECT * FROM products WHERE product_id = ?`;
    var product = await exe(sql2, [product_info[0].product_id]);
    product_info[0].product_name = product[0].product_name; // Add product name to the variation info
    var packet = { product_info, product };
    res.render("admin/edit_product_variation.ejs",packet);
  }
);

router.post("/update_product_variations", async function (req, res) {
  var data = req.body;
  var sql = `UPDATE product_variations SET variation_title = ?, variation_market_price = ?, variation_price = ?, available_stock = ? WHERE products_variation_id = ?`;
  var result = await exe(sql, [
    data.variation_title,
    data.variation_market_price,
    data.variation_price,
    data.available_stock,
    data.products_variation_id,
  ]);
  res.redirect("/admin/add_product_variantions/" + data.product_id);
});

router.get("/delete_product_variation/:products_variation_id",  async function (req, res) {
  var products_variation_id = req.params.products_variation_id;

  var row1sql = `SELECT product_id FROM product_variations WHERE products_variation_id = ?`;
  var result = await exe(row1sql, [products_variation_id]);
  var product_id = result[0].product_id;

  var sql = `DELETE FROM product_variations WHERE products_variation_id = ?`;
  var result = await exe(sql, [products_variation_id]);
  res.redirect("/admin/add_product_variantions/" + product_id);
});

router.get("/add_product_details/:product_id", async function (req, res) {
  var product_id = req.params.product_id;

  var sql = `SELECT * FROM products WHERE product_id = ?`;
  var info = await exe(sql, [product_id]);

  var sql2 = `SELECT * FROM product_descriptions WHERE product_id = ?`;
  var descriptions = await exe(sql2, [product_id]);

  var sql3 = `SELECT * FROM product_specifications WHERE product_id = ?`;
  var specifications = await exe(sql3, [product_id]);

  var packet = { info, descriptions, specifications };
  res.render("admin/add_product_details.ejs", packet);
});

router.post("/save_description", async function (req, res) {
  var data = req.body;
  var sql = `INSERT INTO product_descriptions (product_id, description_title, description_content) VALUES (?,?,?)`;
  var result = await exe(sql, [
    data.product_id,
    data.description_title,
    data.description_content
  ]);
  res.redirect("/admin/add_product_details/" + data.product_id);
});

router.get("/delete_description/:description_id", async function (req, res) {
  var description_id = req.params.description_id;

  // First get the product_id before deleting
  var getProductSql = `SELECT product_id FROM product_descriptions WHERE prodesc_id = ?`;
  var productResult = await exe(getProductSql, [description_id]);
  var product_id = productResult[0].product_id;

  // Then delete the description
  var sql = `DELETE FROM product_descriptions WHERE prodesc_id = ?`;
  await exe(sql, [description_id]);

  // Redirect using the retrieved product_id
  res.redirect("/admin/add_product_details/" + product_id);
});

router.post("/save_specifications", async function (req, res) {
  var data = req.body;
  var sql = `INSERT INTO product_specifications (product_id, spec_title, spec_description) VALUES (?,?,?)`;
  var result = await exe(sql, [
    data.product_id,
    data.spec_title,
    data.spec_description
  ]);
  res.redirect("/admin/add_product_details/" + data.product_id);
});

router.get("/delete_specification/:specification_id", async function (req, res) {
  var specification_id = req.params.specification_id;
  var getProductSql = `SELECT product_id FROM product_specifications WHERE prospecif_id = ?`;
  var productResult = await exe(getProductSql, [specification_id]);
  var product_id = productResult[0].product_id;

  var sql = `DELETE FROM product_specifications WHERE prospecif_id = ?`;
  await exe(sql, [specification_id]);

  res.redirect("/admin/add_product_details/" + product_id);
});


router.get("/slider", async function (req, res) {
  var sql = `SELECT * FROM sliders`;
  var sliders = await exe(sql);
  var packet = { sliders };
  res.render("admin/slider.ejs", packet);
});

router.post("/save_slider", async function (req, res) {
  if (req.files) {
    var filename = Date.now() + "_" + req.files.slider_image.name;
    req.files.slider_image.mv("public/uploads/slider/" + filename);
  }

  var data = req.body;
  var sql = `INSERT INTO sliders (slider_image, slider_title, slider_description, slider_button_text, slider_button_link) VALUES (?,?,?,?,?)`;
  var result = await exe(sql, [
    filename,
    data.slider_title,
    data.slider_description,
    data.slider_button_text,
    data.slider_button_link,
  ]);
  res.redirect("/admin/slider");
});

router.get("/edit_slider/:slider_id", async function(req,res){
  var slider_id = req.params.slider_id;
  var sql = `SELECT * FROM sliders WHERE slider_id = ?`;
  var info = await exe(sql, [slider_id]);
  var packet = { info };
  res.render("admin/edit_slider.ejs", packet);
});

router.post("/update_slider", async function(req,res){
  var data = req.body;
  var sql = `UPDATE sliders SET slider_title = ?, slider_description = ?, slider_button_text = ?, slider_button_link = ? WHERE slider_id = ?`;
  var result = await exe(sql, [
    data.slider_title,
    data.slider_description,
    data.slider_button_text,
    data.slider_button_link,
    data.slider_id
  ]);

  if(req.files){
    var filename = Date.now() + "_" + req.files.slider_image.name;
    req.files.slider_image.mv("public/uploads/slider/" + filename);
    var sql2 = `UPDATE sliders SET slider_image = ? WHERE slider_id = ?`;
    var result = await exe(sql2, [filename, data.slider_id]);
  }
  res.redirect("/admin/slider");
});

router.get("/delete_slider/:slider_id", async function(req,res){
  var slider_id = req.params.slider_id;
  var sql = `DELETE FROM sliders WHERE slider_id = ?`;
  var result = await exe(sql, [slider_id]);
  res.redirect("/admin/slider");
});

router.get("/orders", async function (req, res) {
  res.render("admin/orders.ejs");
});

router.get("/pending_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'pending'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/pending_orders.ejs", packet);
});

router.get("/dispatch_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'dispatch'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/dispatch_orders.ejs", packet);
});

router.get("/dispatch/:order_id", async function (req,res){
  var order_id = req.params.order_id;
  var dispatch_date = new Date().toLocaleDateString('en-CA');
  var sql = `UPDATE orders SET order_status = 'dispatch', dispatch_date = ? WHERE order_id = ?`;
  var result = await exe(sql, [dispatch_date, order_id]);
  res.redirect("/admin/order_details/" + order_id);
});

router.get("/deliver_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'delivered'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/deliver_orders.ejs", packet);
});

router.get("/deliver/:order_id", async function (req, res) {
  var order_id = req.params.order_id;
  var deliver_date = new Date().toLocaleDateString('en-CA');
  var sql = `UPDATE orders SET order_status = 'delivered', deliver_date = ? WHERE order_id = ?`;
  var result = await exe(sql, [deliver_date, order_id]);
  res.redirect("/admin/order_details/" + order_id);
});


router.get("/cancelled_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'cancelled'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/cancelled_orders.ejs", packet);
});

router.get("/cancel/:order_id", async function (req, res) {
  var order_id = req.params.order_id;
  var cancel_date = new Date().toLocaleDateString('en-CA');
  var sql = `UPDATE orders SET order_status = 'cancelled' , cancel_date = ? WHERE order_id = ?`;
  var result = await exe(sql, [cancel_date, order_id]);
  res.redirect("/admin/order_details/" + order_id);
});
  
router.get("/return_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'return'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/return_orders.ejs", packet);
});

router.get("/return/:order_id", async function (req, res) {
  var order_id = req.params.order_id;
  var return_date = new Date().toLocaleDateString('en-CA');
  var sql = `UPDATE orders SET order_status = 'return' , return_date = ? WHERE order_id = ?`;
  var result = await exe(sql, [return_date, order_id]);
  res.redirect("/admin/order_details/" + order_id);
});

router.get("/refund_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'refund'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/refund_orders.ejs", packet);
});

router.get("/refund/:order_id", async function (req, res) {
  var order_id = req.params.order_id;
  var refund_date = new Date().toLocaleDateString('en-CA');
  var sql = `UPDATE orders SET order_status = 'refund' , refund_date = ? WHERE order_id = ?`;
  var result = await exe(sql, [refund_date, order_id]);
  res.redirect("/admin/order_details/" + order_id);
});

router.get("/rejected_orders", async function (req, res) {
  var sql = `SELECT * FROM orders WHERE order_status = 'rejected'`;
  var order = await exe(sql);
  var packet = { order };
  res.render("admin/rejected_orders.ejs", packet);
});

router.get("/reject/:order_id", async function (req, res) {
  var order_id = req.params.order_id;
  var rejected_date = new Date().toLocaleDateString('en-CA');
  var sql = `UPDATE orders SET order_status = 'rejected' , rejected_date = ? WHERE order_id = ?`;
  var result = await exe(sql, [rejected_date, order_id]);
  res.redirect("/admin/order_details/" + order_id);
});

router.get("/order_details/:order_id", async function (req, res) {

  var order_id = req.params.order_id;
  var sql = `SELECT * FROM orders WHERE order_id = ?`;
  var order = await exe(sql, [order_id]);

  var sql2 = `SELECT * FROM order_products,products,product_variations WHERE order_products.order_id = ? AND order_products.product_id = products.product_id AND order_products.products_variation_id = product_variations.products_variation_id`;
  var order_products = await exe(sql2, [order_id]);

  var packet = { order, order_products };
  res.render("admin/order_details.ejs", packet);
});

router.get("/settings", function (req, res) {
  res.render("admin/settings.ejs");
});

router.get("/terms", async function (req, res) {
  var sql = `SELECT * FROM terms_conditions`;
  var terms = await exe(sql);
  var packet = { terms };
  res.render("admin/terms.ejs", packet);
});

router.post("/save_terms", async function (req, res) {
  var data = req.body;
  var sql = `INSERT INTO terms_conditions (terms_title, terms_description) VALUES (?,?)`;
  var result = await exe(sql, [data.terms_title, data.terms_description]);
  res.redirect("/admin/terms");
});

router.get("/edit_terms/:terms_id", async function (req, res) {
  var terms_id = req.params.terms_id;
  var sql = `SELECT * FROM terms_conditions WHERE terms_id = ?`;
  var terms_info = await exe(sql, [terms_id]);
  var packet = { terms_info };
  res.render("admin/edit_terms.ejs", packet);
});

router.post("/update_terms", async function (req, res) {
  var data = req.body;
  var sql = `UPDATE terms_conditions SET terms_title = ?, terms_description = ? WHERE terms_id = ?`;
  await exe(sql, [data.terms_title, data.terms_description, data.terms_id]);
  res.redirect("/admin/terms");
});

router.get("/delete_terms/:terms_id", async function (req, res) {
  var terms_id = req.params.terms_id;
  var sql = `DELETE FROM terms_conditions WHERE terms_id = ?`;
  await exe(sql, [terms_id]);
  res.redirect("/admin/terms");
});

router.get("/privacy", async function (req,res){
  var sql = `SELECT * FROM privacy_policy`;
  var privacy = await exe(sql);
  var packet = { privacy };
  res.render("admin/privacy.ejs", packet);
});

router.post("/save_privacy", async function (req, res) {
  var data = req.body;
  var sql = `INSERT INTO privacy_policy (privacy_title, privacy_description) VALUES (?,?)`;
  var result = await exe(sql, [data.privacy_title, data.privacy_description]);
  res.redirect("/admin/privacy");
});

router.get("/edit_privacy/:privacy_id", async function (req, res) {
  var privacy_id = req.params.privacy_id;
  var sql = `SELECT * FROM privacy_policy WHERE privacy_id = ?`;
  var privacy_info = await exe(sql, [privacy_id]);
  var packet = { privacy_info };
  res.render("admin/edit_privacy.ejs", packet);
});

router.post("/update_privacy", async function (req, res) {
  var data = req.body;
  var sql = `UPDATE privacy_policy SET privacy_title = ?, privacy_description = ? WHERE privacy_id = ?`;
  await exe(sql, [data.privacy_title, data.privacy_description, data.privacy_id]);
  res.redirect("/admin/privacy");
});

router.get("/delete_privacy/:privacy_id", async function (req, res) {
  var privacy_id = req.params.privacy_id;
  var sql = `DELETE FROM privacy_policy WHERE privacy_id = ?`;
  await exe(sql, [privacy_id]);
  res.redirect("/admin/privacy");
});

router.get("/about", async function (req,res){
  var sql = `SELECT * FROM about`;
  var about = await exe(sql);
  var packet = { about };
  res.render("admin/about.ejs", packet );
});

router.post("/save_about", async function (req, res) {
  var data = req.body;
  var filename = "";

  if (req.files && req.files.about_image) {
    filename = Date.now() + "_" + req.files.about_image.name;
    req.files.about_image.mv("public/uploads/about/" + filename);
  } else if (data.old_image) {
    filename = data.old_image;
  }

  var existing = await exe("SELECT * FROM about");

  if (existing && existing.length > 0) {
    var sqlUpdate = `
      UPDATE about 
      SET 
        about_title = ?, 
        about_description = ?, 
        about_button_text = ?, 
        about_image = ?
      LIMIT 1
    `;
    await exe(sqlUpdate, [
      data.about_title,
      data.about_description,
      data.about_button_text,
      filename || existing[0].about_image,
    ]);
  } else {
    var sqlInsert = `
      INSERT INTO about 
      (about_title, about_description, about_button_text, about_image) 
      VALUES (?,?,?,?,?)
    `;
    await exe(sqlInsert, [
      data.about_title,
      data.about_description,
      data.about_button_text,
      data.about_button_link,
      filename,
    ]);
  }
  res.redirect("/admin/about");
});

router.get("/team", async function (req, res) {
  var sql = `SELECT * FROM team_member`;
  var team_members = await exe(sql);
  var packet = { team_members };
  res.render("admin/team.ejs", packet);
});

router.post("/save_team_member", async function (req, res) {
  var data = req.body;

  if( req.files ) {
    var filename = Date.now() + "_" + req.files.member_image.name;
    req.files.member_image.mv("public/uploads/team/" + filename);
  }
  var sql = `INSERT INTO team_member (member_image, member_name, member_position, member_description) VALUES (?,?,?,?)`;
  await exe(sql, [filename, data.member_name, data.member_position, data.member_description]);
  res.redirect("/admin/team");
});

router.get("/edit_team/:member_id", async function (req, res) {
  var member_id = req.params.member_id;
  var sql = `SELECT * FROM team_member WHERE member_id = ?`;
  var member_info = await exe(sql, [member_id]);
  var packet = { member_info };
  res.render("admin/edit_team_member.ejs", packet);
});

router.post("/update_team_member", async function (req, res) {
  var data = req.body;

  var sql = `UPDATE team_member SET member_name = ?, member_position = ?, member_description = ? WHERE member_id = ?`;
  await exe(sql, [data.member_name, data.member_position, data.member_description, data.member_id]);

  if( req.files ) {
    var filename = Date.now() + "_" + req.files.member_image.name;
    req.files.member_image.mv("public/uploads/team/" + filename);

    sql = `UPDATE team_member SET member_image = ? WHERE member_id = ?`;
    await exe(sql, [filename, data.member_id]);
  }

  res.redirect("/admin/team");
});

router.get("/delete_team/:member_id", async function (req, res) {
  var member_id = req.params.member_id;
  var sql = `DELETE FROM team_member WHERE member_id = ?`;
  await exe(sql, [member_id]);
  res.redirect("/admin/team");
});

router.get("/contact", async function (req, res) {
  var sql = `SELECT * FROM contact_us`;
  var contact_messages = await exe(sql);
  var packet = { contact_messages };
  res.render("admin/contact.ejs", packet);
});

router.get("/delete_message/:contact_id", async function (req, res) {
  var contact_id = req.params.contact_id;
  var sql = `DELETE FROM contact_us WHERE contact_id = ?`;
  await exe(sql, [contact_id]);
  res.redirect("/admin/contact");
});

router.get("/logout", function (req, res) {
  res.send("Logout Page");
});

module.exports = router;
