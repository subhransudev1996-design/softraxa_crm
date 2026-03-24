use tauri::Manager;
use machine_uid;
use serde::{Serialize, Deserialize};
use std::fs;
use sqlx::sqlite::SqlitePool;

// --- Models ---
#[derive(Serialize, Deserialize)]
struct ActivationRequest {
    #[serde(rename = "licenseKey")]
    license_key: String,
    #[serde(rename = "hardwareId")]
    hardware_id: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Settings {
    id: i64,
    company_name: Option<String>,
    address: Option<String>,
    gstin: Option<String>,
    state_code: Option<String>,
    bank_details: Option<String>,
    logo_data: Option<String>,
    signature_data: Option<String>,
    upi_id: Option<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    id: i64,
    name: String,
    description: Option<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Tax {
    id: i64,
    name: String,
    rate_percent: f64,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    id: i64,
    name: String,
    description: Option<String>,
    category_id: Option<i64>,
    hsn_sac: Option<String>,
    tax_id: Option<i64>,
    has_variations: bool,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct ProductVariation {
    id: i64,
    product_id: i64,
    name: String,
    sku: Option<String>,
    barcode: Option<String>,
    batch_no: Option<String>,
    expiry_date: Option<String>,
    mrp: f64,
    purchase_price: f64,
    selling_price: f64,
    current_stock: i32,
    low_stock_alert: i32,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct SerialNumber {
    id: i64,
    variation_id: i64,
    serial_number: String,
    status: String, // 'AVAILABLE', 'SOLD', 'DEFECTIVE'
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    id: i64,
    name: String,
    gstin: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    state_code: Option<String>,
    billing_address: Option<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Vendor {
    id: i64,
    name: String,
    gstin: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    state_code: Option<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Invoice {
    id: i64,
    invoice_number: String,
    customer_id: i64,
    items: String, // JSON payload
    subtotal: f64,
    cgst_total: f64,
    sgst_total: f64,
    igst_total: f64,
    grand_total: f64,
    invoice_date: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Purchase {
    id: i64,
    purchase_number: String,
    vendor_id: i64,
    items: String, // JSON payload
    subtotal: f64,
    cgst_total: f64,
    sgst_total: f64,
    igst_total: f64,
    grand_total: f64,
    purchase_date: String,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct CreditNote {
    id: i64,
    cn_number: String,
    invoice_number: String,
    customer_id: i64,
    items: String, // JSON payload
    subtotal: f64,
    cgst_total: f64,
    sgst_total: f64,
    igst_total: f64,
    grand_total: f64,
    cn_date: String,
}

pub struct DbState(pub SqlitePool);

// --- Licensing Commands ---
#[tauri::command]
fn get_machine_id() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}

#[tauri::command]
async fn activate_license(key: String, machine_id: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client.post("http://localhost:3000/api/license/activate")
        .json(&ActivationRequest {
            license_key: key,
            hardware_id: machine_id,
        })
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(res.text().await.map_err(|e| e.to_string())?)
    } else {
        Err(res.text().await.unwrap_or_else(|_| "Activation failed".to_string()))
    }
}

// --- Settings Commands ---
#[tauri::command]
async fn get_settings(state: tauri::State<'_, DbState>) -> Result<Option<Settings>, String> {
    let settings = sqlx::query_as::<_, Settings>("SELECT * FROM settings WHERE id = 1")
        .fetch_optional(&state.0).await.map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
async fn save_settings(
    state: tauri::State<'_, DbState>, company_name: Option<String>, address: Option<String>,
    gstin: Option<String>, state_code: Option<String>, bank_details: Option<String>, logo_data: Option<String>, signature_data: Option<String>, upi_id: Option<String>
) -> Result<(), String> {
    sqlx::query("INSERT INTO settings (id, company_name, address, gstin, state_code, bank_details, logo_data, signature_data, upi_id) 
                 VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET 
                 company_name=excluded.company_name, address=excluded.address, 
                 gstin=excluded.gstin, state_code=excluded.state_code, bank_details=excluded.bank_details, logo_data=excluded.logo_data, signature_data=excluded.signature_data, upi_id=excluded.upi_id")
        .bind(company_name).bind(address).bind(gstin).bind(state_code).bind(bank_details).bind(logo_data).bind(signature_data).bind(upi_id)
        .execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- ERP Master Commands ---
#[tauri::command]
async fn get_categories(state: tauri::State<'_, DbState>) -> Result<Vec<Category>, String> {
    sqlx::query_as::<_, Category>("SELECT * FROM categories ORDER BY name ASC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_category(state: tauri::State<'_, DbState>, name: String, description: Option<String>) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO categories (name, description) VALUES (?, ?)")
        .bind(name).bind(description).execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn delete_category(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM categories WHERE id=?").bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_taxes(state: tauri::State<'_, DbState>) -> Result<Vec<Tax>, String> {
    sqlx::query_as::<_, Tax>("SELECT * FROM taxes ORDER BY rate_percent ASC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_tax(state: tauri::State<'_, DbState>, name: String, rate_percent: f64) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO taxes (name, rate_percent) VALUES (?, ?)")
        .bind(name).bind(rate_percent).execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn delete_tax(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM taxes WHERE id=?").bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Product Commands ---
#[tauri::command]
async fn get_products(state: tauri::State<'_, DbState>) -> Result<Vec<Product>, String> {
    sqlx::query_as::<_, Product>("SELECT * FROM products ORDER BY name ASC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_product(
    state: tauri::State<'_, DbState>, name: String, description: Option<String>, 
    category_id: Option<i64>, hsn_sac: Option<String>, tax_id: Option<i64>, has_variations: bool,
    mrp: Option<f64>, purchase_price: Option<f64>, selling_price: Option<f64>, stock: Option<i32>,
    sku: Option<String>, batch_no: Option<String>, barcode: Option<String>, expiry_date: Option<String>
) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO products (name, description, category_id, hsn_sac, tax_id, has_variations) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(&name).bind(description).bind(category_id).bind(hsn_sac).bind(tax_id).bind(has_variations)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();

    if !has_variations {
        sqlx::query("INSERT INTO product_variations (product_id, name, sku, barcode, batch_no, expiry_date, mrp, purchase_price, selling_price, current_stock, low_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5)")
            .bind(id).bind("Default").bind(sku).bind(barcode).bind(batch_no).bind(expiry_date)
            .bind(mrp.unwrap_or(0.0)).bind(purchase_price.unwrap_or(0.0)).bind(selling_price.unwrap_or(0.0)).bind(stock.unwrap_or(0))
            .execute(&state.0).await.map_err(|e| e.to_string())?;
    }

    Ok(id)
}

#[tauri::command]
async fn delete_product(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM products WHERE id=?").bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Product Variation Commands ---
#[tauri::command]
async fn get_product_variations(state: tauri::State<'_, DbState>, product_id: i64) -> Result<Vec<ProductVariation>, String> {
    sqlx::query_as::<_, ProductVariation>("SELECT * FROM product_variations WHERE product_id = ?")
        .bind(product_id).fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_all_variations(state: tauri::State<'_, DbState>) -> Result<Vec<ProductVariation>, String> {
    sqlx::query_as::<_, ProductVariation>("SELECT * FROM product_variations ORDER BY name ASC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_product_variation(
    state: tauri::State<'_, DbState>, product_id: i64, name: String, sku: Option<String>, barcode: Option<String>, 
    batch_no: Option<String>, expiry_date: Option<String>, mrp: f64, purchase_price: f64, selling_price: f64, current_stock: i32, low_stock_alert: Option<i32>
) -> Result<i64, String> {
    let alert_val = low_stock_alert.unwrap_or(5);
    let id = sqlx::query("INSERT INTO product_variations (product_id, name, sku, barcode, batch_no, expiry_date, mrp, purchase_price, selling_price, current_stock, low_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(product_id).bind(name).bind(sku).bind(barcode).bind(batch_no).bind(expiry_date).bind(mrp).bind(purchase_price).bind(selling_price).bind(current_stock).bind(alert_val)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn delete_product_variation(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM product_variations WHERE id=?").bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Serial Number Commands ---
#[tauri::command]
async fn get_serial_numbers(state: tauri::State<'_, DbState>, variation_id: i64) -> Result<Vec<SerialNumber>, String> {
    sqlx::query_as::<_, SerialNumber>("SELECT * FROM serial_numbers WHERE variation_id = ? ORDER BY id ASC")
        .bind(variation_id).fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_serial_number(state: tauri::State<'_, DbState>, variation_id: i64, serial_number: String) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO serial_numbers (variation_id, serial_number, status) VALUES (?, ?, 'AVAILABLE')")
        .bind(variation_id).bind(serial_number).execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn update_serial_status(state: tauri::State<'_, DbState>, id: i64, status: String) -> Result<(), String> {
    sqlx::query("UPDATE serial_numbers SET status=? WHERE id=?").bind(status).bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn delete_serial_number(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM serial_numbers WHERE id=?").bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Customer Commands ---
#[tauri::command]
async fn get_customers(state: tauri::State<'_, DbState>) -> Result<Vec<Customer>, String> {
    sqlx::query_as::<_, Customer>("SELECT * FROM customers ORDER BY name ASC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_customer(
    state: tauri::State<'_, DbState>, name: String, gstin: Option<String>, 
    phone: Option<String>, address: Option<String>, state_code: Option<String>, billing_address: Option<String>
) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO customers (name, gstin, phone, address, state_code, billing_address) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(name).bind(gstin).bind(phone).bind(address).bind(state_code).bind(billing_address)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn update_customer(
    state: tauri::State<'_, DbState>, id: i64, name: String, gstin: Option<String>, 
    phone: Option<String>, address: Option<String>, state_code: Option<String>, billing_address: Option<String>
) -> Result<(), String> {
    sqlx::query("UPDATE customers SET name=?, gstin=?, phone=?, address=?, state_code=?, billing_address=? WHERE id=?")
        .bind(name).bind(gstin).bind(phone).bind(address).bind(state_code).bind(billing_address).bind(id)
        .execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Vendor Commands ---
#[tauri::command]
async fn get_vendors(state: tauri::State<'_, DbState>) -> Result<Vec<Vendor>, String> {
    sqlx::query_as::<_, Vendor>("SELECT * FROM vendors ORDER BY name ASC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_vendor(
    state: tauri::State<'_, DbState>, name: String, gstin: Option<String>, 
    phone: Option<String>, address: Option<String>, state_code: Option<String>
) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO vendors (name, gstin, phone, address, state_code) VALUES (?, ?, ?, ?, ?)")
        .bind(name).bind(gstin).bind(phone).bind(address).bind(state_code)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn update_vendor(
    state: tauri::State<'_, DbState>, id: i64, name: String, gstin: Option<String>, 
    phone: Option<String>, address: Option<String>, state_code: Option<String>
) -> Result<(), String> {
    sqlx::query("UPDATE vendors SET name=?, gstin=?, phone=?, address=?, state_code=? WHERE id=?")
        .bind(name).bind(gstin).bind(phone).bind(address).bind(state_code).bind(id)
        .execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Invoice & Stock Engine ---
#[tauri::command]
async fn get_invoices(state: tauri::State<'_, DbState>) -> Result<Vec<Invoice>, String> {
    sqlx::query_as::<_, Invoice>("SELECT * FROM invoices ORDER BY invoice_date DESC, id DESC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_invoice(
    state: tauri::State<'_, DbState>, invoice_number: String, customer_id: i64, 
    items: String, subtotal: f64, cgst_total: f64, sgst_total: f64, igst_total: f64, grand_total: f64
) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO invoices (invoice_number, customer_id, items, subtotal, cgst_total, sgst_total, igst_total, grand_total, invoice_date) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
        .bind(invoice_number).bind(customer_id).bind(items)
        .bind(subtotal).bind(cgst_total).bind(sgst_total).bind(igst_total).bind(grand_total)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn delete_invoice(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    let invoice: Invoice = sqlx::query_as("SELECT * FROM invoices WHERE id = ?")
        .bind(id)
        .fetch_one(&state.0)
        .await
        .map_err(|e| e.to_string())?;

    let items: Vec<serde_json::Value> = serde_json::from_str(&invoice.items).unwrap_or(vec![]);
    
    for item in items {
        let variation_id = item["variationId"].as_i64().unwrap_or(0);
        let qty = item["qty"].as_i64().unwrap_or(0);
        
        sqlx::query("UPDATE product_variations SET current_stock = current_stock + ? WHERE id = ?")
            .bind(qty).bind(variation_id).execute(&state.0).await.map_err(|e| e.to_string())?;

        if let Some(serials) = item["selectedSerials"].as_array() {
            for s_obj in serials {
                let sid = s_obj["id"].as_i64().unwrap_or(0);
                sqlx::query("UPDATE serial_numbers SET status = 'AVAILABLE' WHERE id = ?")
                    .bind(sid).execute(&state.0).await.map_err(|e| e.to_string())?;
            }
        }
    }

    sqlx::query("DELETE FROM invoices WHERE id = ?")
        .bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn execute_stock_deduction(
    state: tauri::State<'_, DbState>, variation_id: i64, qty: i32, serial_ids: Vec<i64>
) -> Result<(), String> {
    sqlx::query("UPDATE product_variations SET current_stock = current_stock - ? WHERE id = ?")
        .bind(qty).bind(variation_id).execute(&state.0).await.map_err(|e| e.to_string())?;
        
    for sid in serial_ids {
        sqlx::query("UPDATE serial_numbers SET status = 'SOLD' WHERE id = ?")
            .bind(sid).execute(&state.0).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

// --- Purchase Engine ---
#[tauri::command]
async fn get_purchases(state: tauri::State<'_, DbState>) -> Result<Vec<Purchase>, String> {
    sqlx::query_as::<_, Purchase>("SELECT * FROM purchases ORDER BY purchase_date DESC, id DESC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_purchase(
    state: tauri::State<'_, DbState>, purchase_number: String, vendor_id: i64, 
    items: String, subtotal: f64, cgst_total: f64, sgst_total: f64, igst_total: f64, grand_total: f64
) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO purchases (purchase_number, vendor_id, items, subtotal, cgst_total, sgst_total, igst_total, grand_total, purchase_date) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
        .bind(purchase_number).bind(vendor_id).bind(items)
        .bind(subtotal).bind(cgst_total).bind(sgst_total).bind(igst_total).bind(grand_total)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn delete_purchase(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    let purchase: Purchase = sqlx::query_as("SELECT * FROM purchases WHERE id = ?")
        .bind(id)
        .fetch_one(&state.0)
        .await
        .map_err(|e| e.to_string())?;

    let items: Vec<serde_json::Value> = serde_json::from_str(&purchase.items).unwrap_or(vec![]);
    
    for item in items {
        let variation_id = item["variationId"].as_i64().unwrap_or(0);
        let qty = item["qty"].as_i64().unwrap_or(0);
        
        let empty_vec = vec![];
        let serials = item["selectedSerials"].as_array().unwrap_or(&empty_vec);
        
        // Reverse stock additions
        sqlx::query("UPDATE product_variations SET current_stock = current_stock - ? WHERE id = ?")
            .bind(qty).bind(variation_id).execute(&state.0).await.map_err(|e| e.to_string())?;

        for s_val in serials {
            if let Some(s) = s_val.as_str() {
                // Delete serials that were added by this purchase invoice, but only if they are still 'AVAILABLE'. 
                // If they are 'SOLD', it means they are out in an invoice, so deleting the purchase is unsafe, 
                // but we will force delete them from available queue to keep stock math loosely right in offline apps
                sqlx::query("DELETE FROM serial_numbers WHERE variation_id = ? AND serial_number = ? AND status = 'AVAILABLE'")
                    .bind(variation_id).bind(s).execute(&state.0).await.map_err(|e| e.to_string())?;
            }
        }
    }

    sqlx::query("DELETE FROM purchases WHERE id = ?")
        .bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn execute_stock_addition(
    state: tauri::State<'_, DbState>, variation_id: i64, qty: i32, serials: Vec<String>
) -> Result<(), String> {
    sqlx::query("UPDATE product_variations SET current_stock = current_stock + ? WHERE id = ?")
        .bind(qty).bind(variation_id).execute(&state.0).await.map_err(|e| e.to_string())?;
        
    for serial in serials {
        sqlx::query("INSERT OR IGNORE INTO serial_numbers (variation_id, serial_number, status) VALUES (?, ?, 'AVAILABLE')")
            .bind(variation_id).bind(serial).execute(&state.0).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

// --- Sales Returns / Credit Notes ---
#[tauri::command]
async fn get_credit_notes(state: tauri::State<'_, DbState>) -> Result<Vec<CreditNote>, String> {
    sqlx::query_as::<_, CreditNote>("SELECT * FROM credit_notes ORDER BY id DESC")
        .fetch_all(&state.0).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_credit_note(
    state: tauri::State<'_, DbState>, cn_number: String, invoice_number: Option<String>, customer_id: i64, items: String,
    subtotal: f64, cgst_total: f64, sgst_total: f64, igst_total: f64, grand_total: f64
) -> Result<i64, String> {
    let id = sqlx::query("INSERT INTO credit_notes (cn_number, invoice_number, customer_id, items, subtotal, cgst_total, sgst_total, igst_total, grand_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(cn_number).bind(invoice_number).bind(customer_id).bind(items)
        .bind(subtotal).bind(cgst_total).bind(sgst_total).bind(igst_total).bind(grand_total)
        .execute(&state.0).await.map_err(|e| e.to_string())?.last_insert_rowid();
    Ok(id)
}

#[tauri::command]
async fn execute_return_stock_addition(
    state: tauri::State<'_, DbState>, variation_id: i64, qty: i32, serials: Vec<String>
) -> Result<(), String> {
    sqlx::query("UPDATE product_variations SET current_stock = current_stock + ? WHERE id = ?")
        .bind(qty).bind(variation_id).execute(&state.0).await.map_err(|e| e.to_string())?;
        
    for serial in serials {
        // Returned serials go back to AVAILABLE
        sqlx::query("UPDATE serial_numbers SET status = 'AVAILABLE' WHERE variation_id = ? AND serial_number = ?")
            .bind(variation_id).bind(&serial).execute(&state.0).await.map_err(|e| e.to_string())?;
        
        sqlx::query("INSERT OR IGNORE INTO serial_numbers (variation_id, serial_number, status) VALUES (?, ?, 'AVAILABLE')")
            .bind(variation_id).bind(&serial).execute(&state.0).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn delete_credit_note(state: tauri::State<'_, DbState>, id: i64) -> Result<(), String> {
    sqlx::query("DELETE FROM credit_notes WHERE id = ?")
        .bind(id).execute(&state.0).await.map_err(|e| e.to_string())?;
    Ok(())
}

// --- Main Setup ---
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();
            let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
            fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
            
            // Initializing the V3 ERP SQLite Database Engine
            let db_path = app_dir.join("softraxa_billing_v3.db");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.to_string_lossy());
            
            tauri::async_runtime::block_on(async move {
                let pool = SqlitePool::connect(&db_url).await.expect("Failed to connect to SQLite ERP Engine");
                
                sqlx::query("CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY,
                    company_name TEXT, address TEXT, gstin TEXT, state_code TEXT, bank_details TEXT, logo_data TEXT, signature_data TEXT, upi_id TEXT
                )").execute(&pool).await.expect("Table error");
                
                let _ = sqlx::query("ALTER TABLE settings ADD COLUMN logo_data TEXT").execute(&pool).await;
                let _ = sqlx::query("ALTER TABLE settings ADD COLUMN signature_data TEXT").execute(&pool).await;
                let _ = sqlx::query("ALTER TABLE settings ADD COLUMN upi_id TEXT").execute(&pool).await;

                sqlx::query("CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT
                )").execute(&pool).await.expect("Table error");

                sqlx::query("CREATE TABLE IF NOT EXISTS taxes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, rate_percent REAL NOT NULL
                )").execute(&pool).await.expect("Table error");

                sqlx::query("CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL, description TEXT,
                    category_id INTEGER, hsn_sac TEXT, tax_id INTEGER,
                    has_variations BOOLEAN DEFAULT 1,
                    FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
                    FOREIGN KEY(tax_id) REFERENCES taxes(id) ON DELETE SET NULL
                )").execute(&pool).await.expect("Table error");

                let _ = sqlx::query("ALTER TABLE products ADD COLUMN has_variations BOOLEAN DEFAULT 1").execute(&pool).await;

                sqlx::query("CREATE TABLE IF NOT EXISTS product_variations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    name TEXT NOT NULL, sku TEXT, barcode TEXT, batch_no TEXT, expiry_date TEXT,
                    mrp REAL DEFAULT 0.0, purchase_price REAL DEFAULT 0.0, selling_price REAL DEFAULT 0.0, current_stock INTEGER DEFAULT 0,
                    low_stock_alert INTEGER DEFAULT 5,
                    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
                )").execute(&pool).await.expect("Table error");

                let _ = sqlx::query("ALTER TABLE product_variations ADD COLUMN low_stock_alert INTEGER DEFAULT 5").execute(&pool).await;

                sqlx::query("CREATE TABLE IF NOT EXISTS serial_numbers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    variation_id INTEGER NOT NULL,
                    serial_number TEXT NOT NULL UNIQUE,
                    status TEXT DEFAULT 'AVAILABLE',
                    FOREIGN KEY(variation_id) REFERENCES product_variations(id) ON DELETE CASCADE
                )").execute(&pool).await.expect("Table error");

                sqlx::query("CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL, gstin TEXT, phone TEXT, address TEXT, state_code TEXT, billing_address TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )").execute(&pool).await.expect("Table error");

                sqlx::query("CREATE TABLE IF NOT EXISTS invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_number TEXT NOT NULL, customer_id INTEGER, items TEXT,
                    subtotal REAL DEFAULT 0.0, cgst_total REAL DEFAULT 0.0, sgst_total REAL DEFAULT 0.0, igst_total REAL DEFAULT 0.0, grand_total REAL DEFAULT 0.0,
                    invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(customer_id) REFERENCES customers(id)
                )").execute(&pool).await.expect("Table error");
                
                sqlx::query("CREATE TABLE IF NOT EXISTS vendors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL, gstin TEXT, phone TEXT, address TEXT, state_code TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )").execute(&pool).await.expect("Table error");

                sqlx::query("CREATE TABLE IF NOT EXISTS purchases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    purchase_number TEXT NOT NULL, vendor_id INTEGER, items TEXT,
                    subtotal REAL DEFAULT 0.0, cgst_total REAL DEFAULT 0.0, sgst_total REAL DEFAULT 0.0, igst_total REAL DEFAULT 0.0, grand_total REAL DEFAULT 0.0,
                    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(vendor_id) REFERENCES vendors(id)
                )").execute(&pool).await.expect("Table error");
                
                sqlx::query("CREATE TABLE IF NOT EXISTS credit_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cn_number TEXT NOT NULL, invoice_number TEXT, customer_id INTEGER, items TEXT,
                    subtotal REAL DEFAULT 0.0, cgst_total REAL DEFAULT 0.0, sgst_total REAL DEFAULT 0.0, igst_total REAL DEFAULT 0.0, grand_total REAL DEFAULT 0.0,
                    cn_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(customer_id) REFERENCES customers(id)
                )").execute(&pool).await.expect("Table error");
                
                app_handle.manage(DbState(pool));
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_machine_id, activate_license, get_settings, save_settings,
            get_categories, add_category, delete_category,
            get_taxes, add_tax, delete_tax,
            get_products, add_product, delete_product,
            get_product_variations, get_all_variations, add_product_variation, delete_product_variation,
            get_serial_numbers, add_serial_number, update_serial_status, delete_serial_number,
            get_customers, add_customer, update_customer,
            get_vendors, add_vendor, update_vendor,
            get_invoices, create_invoice, execute_stock_deduction, delete_invoice,
            get_purchases, create_purchase, execute_stock_addition, delete_purchase,
            get_credit_notes, create_credit_note, execute_return_stock_addition, delete_credit_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
