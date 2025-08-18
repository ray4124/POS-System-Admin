CREATE DATABASE Afflatus_POS;
USE Afflatus_POS;

# TABLES

CREATE TABLE branches(
	id INT AUTO_INCREMENT NOT NULL,
    branch_name VARCHAR(255),
    created_at DATETIME default CURRENT_TIMESTAMP NOT NULL,
    modified_at DATETIME default CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE brands(
	id INT AUTO_INCREMENT NOT NULL,
    brand_name VARCHAR(255),
    created_at DATETIME default CURRENT_TIMESTAMP NOT NULL,
    modified_at DATETIME default CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE branch_brand(
	id INT AUTO_INCREMENT NOT NULL,
    branch_id INT NOT NULL,
    brand_id INT NOT NULL,
    FOREIGN KEY (branch_id) references branches(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) references brands(id) ON DELETE CASCADE
);

CREATE TABLE products(
	id INT AUTO_INCREMENT NOT NULL,
    branch_id INT NOT NULL,
    FOREIGN KEY (branch_id) references branches(id) ON DELETE CASCADE,
    brand_id INT NOT NULL,
    FOREIGN KEY (brand_id) references brands(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL,
    stock INT NOT NULL,
    alert_at INT NOT NULL,
    is_active BOOL NOT NULL default TRUE,
    created_at DATETIME default CURRENT_TIMESTAMP NOT NULL,
    modified_at DATETIME default CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE promotions(
	id INT AUTO_INCREMENT NOT NULL,
    promotion_name VARCHAR(255),
    description TEXT,
    type VARCHAR(255) NOT NULL,
    value DOUBLE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time_frame TIME,
    end_time_frame TIME,
    minimum_spend INT,
    minimum_item INT,
    created_at DATETIME default CURRENT_TIMESTAMP NOT NULL,
    modified_at DATETIME default CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE promotion_products(
	promotion_id INT NOT NULL,
    FOREIGN KEY (promotion_id) references promotions(id) ON DELETE CASCADE,
    product_id INT NOT NULL,
    FOREIGN KEY (product_id) references products(id) ON DELETE CASCADE
);

CREATE TABLE transactions(
	id INT AUTO_INCREMENT NOT NULL,
    branch_id INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    FOREIGN KEY (branch_id) references branches(id) ON DELETE CASCADE,
    brand_id INT,
	FOREIGN KEY (brand_id) references brands(id) ON DELETE CASCADE,
    transaction_date DATETIME
);

CREATE TABLE transaction_product(
	transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DOUBLE NOT NULL
);

CREATE TABLE employees(
	id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    branch VARCHAR(255),
    added_at DATETIME default CURRENT_TIMESTAMP NOT NULL,
    modified_at DATETIME default CURRENT_TIMESTAMP NOT NULL
);

# -------------------------------------------

