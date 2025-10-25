
CREATE DATABASE airbnb_lab1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'labuser'@'localhost' IDENTIFIED BY 'labpass';
GRANT ALL PRIVILEGES ON airbnb_lab1.* TO 'labuser'@'localhost';
FLUSH PRIVILEGES;




USE airbnb_lab1;

-- Users (Traveler or Owner)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('TRAVELER','OWNER') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traveler profile
CREATE TABLE traveler_profiles (
  user_id INT PRIMARY KEY,
  phone VARCHAR(20),
  about_me TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  state_abbr CHAR(2),
  languages VARCHAR(255),
  gender VARCHAR(20),
  profile_image_url VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Owner profile
CREATE TABLE owner_profiles (
  user_id INT PRIMARY KEY,
  location VARCHAR(255),
  contact_info VARCHAR(255),
  images JSON NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Properties
CREATE TABLE properties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50),
  category VARCHAR(50),
  location VARCHAR(200) NOT NULL,
  country varchar(64),
  description TEXT,
  amenities JSON,
  price_per_night DECIMAL(10,2) NOT NULL,
  bedrooms INT,
  bathrooms INT,
  max_guests INT NOT NULL,
  availability JSON,        -- store date ranges or per-day availability
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Property images
CREATE TABLE property_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Bookings
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  traveler_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  guests INT NOT NULL,
  status ENUM('PENDING','ACCEPTED','CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Favorites
CREATE TABLE favorites (
  traveler_id INT NOT NULL,
  property_id INT NOT NULL,
  PRIMARY KEY (traveler_id, property_id),
  FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);
--
INSERT INTO users(role,name,email,password_hash) VALUES
('OWNER','Olivia Host','owner@example.com','$2b$10$jAzkxKmRVkzC53bffJIgtOb0Mo/jImM/0bPsdJHTqPSGoR1eYQNCq'),
('TRAVELER','Tom Traveler','trav@example.com','$2b$10$T/QR/zpjIpz1atRWXuDOQuHIIXao32gQvy5NThmsqn4YyaQJIgOqC');

/* Users:
trav@example.com
trav123

owner@example.com
owner123 
*/

		