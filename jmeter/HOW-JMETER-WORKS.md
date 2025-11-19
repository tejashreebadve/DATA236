# How JMeter Load Testing Works - Detailed Explanation

## Overview

When you run `jmeter -n -t rednest-combined-test.jmx -Jusers=100`, JMeter simulates 100 concurrent users making requests to your APIs.

---

## Test Execution Flow

### 1. JMeter Creates 100 Threads (Virtual Users)

- JMeter spawns **100 separate threads** (think of them as 100 different browsers/users)
- Each thread is **independent** and runs **concurrently** (at the same time)
- All threads execute the **same sequence** of API calls

### 2. Each Thread Executes This Sequence:

```
Thread 1, Thread 2, ... Thread 100 (all do the same):
  ↓
1. Login Traveler
  ↓
2. Property Search
  ↓
3. Create Booking
  ↓
4. Login Owner
  ↓
5. Owner Accept Booking
```

---

## Detailed Step-by-Step (For Each of 100 Users)

### Step 1: Login Traveler
- **Request:** `POST /api/auth/login/traveler`
- **Body:** 
  ```json
  {
    "email": "loadtestuser@test.com",
    "password": "password123"
  }
  ```
- **Result:** Gets `auth_token` (stored in variable `${auth_token}`)
- **Note:** All 100 users use the **SAME email/password**

### Step 2: Property Search
- **Request:** `GET /api/property/search`
- **Response:** Array of properties `[{_id: "...", name: "..."}, ...]`
- **Extraction:** Takes **FIRST property** from array: `$[0]._id`
- **Stored in:** `${property_id}` variable
- **Important:** All 100 users get the **SAME property ID** (first one in results)

### Step 3: Create Booking
- **Request:** `POST /api/booking`
- **Headers:** `Authorization: Bearer ${auth_token}`
- **Body:**
  ```json
  {
    "propertyId": "${property_id}",  // Same property for all 100 users
    "startDate": "2025-11-25T00:00:00.000Z",  // 7 days from now (SAME for all)
    "endDate": "2025-11-28T00:00:00.000Z",    // 10 days from now (SAME for all)
    "guests": 2,
    "totalPrice": 500
  }
  ```
- **Result:** Creates booking in **MongoDB**
- **Extraction:** Gets `booking_id` from response: `$._id`
- **Stored in:** `${booking_id}` variable
- **Important:** 
  - ✅ All 100 bookings **ARE stored in MongoDB**
  - ⚠️ All 100 bookings are for the **SAME property**
  - ⚠️ All 100 bookings have the **SAME dates** (potential conflicts!)

### Step 4: Login Owner
- **Request:** `POST /api/auth/login/owner`
- **Body:**
  ```json
  {
    "email": "testowner@test.com",
    "password": "password123"
  }
  ```
- **Result:** Gets `owner_token` (stored in `${owner_token}`)
- **Note:** All 100 threads use the **SAME owner account**

### Step 5: Owner Accept Booking
- **Request:** `PUT /api/booking/${booking_id}/status`
- **Headers:** `Authorization: Bearer ${owner_token}`
- **Body:**
  ```json
  {
    "status": "accepted"
  }
  ```
- **Uses:** `${booking_id}` from Step 3 (each thread has its own booking_id)
- **Result:** Updates booking status to "accepted" in MongoDB

---

## Key Points About How It Works

### ✅ What Happens:

1. **100 Bookings Created:**
   - Each of the 100 threads creates **one booking**
   - All 100 bookings are **stored in MongoDB**
   - Each booking has a **unique `_id`** (MongoDB auto-generates)

2. **Same Property:**
   - All 100 users search properties
   - All get the **first property** from results: `$[0]._id`
   - All 100 bookings are for the **same property**

3. **Same Dates:**
   - All bookings use dates calculated at **test start time**
   - Example: If test starts Nov 18, all use Nov 25-28
   - This can cause **date conflicts** (overlapping bookings)

4. **Owner Response:**
   - Each thread (after creating its booking) logs in as owner
   - Each thread tries to accept **its own booking** (using its `${booking_id}`)
   - If property doesn't belong to `testowner@test.com`, accept will fail

### ⚠️ Potential Issues:

1. **Date Conflicts:**
   - 100 bookings for same property, same dates
   - Booking service may reject some due to availability checks
   - First few succeed, rest may fail

2. **Property Ownership:**
   - If first property doesn't belong to `testowner@test.com`
   - Owner Accept Booking will fail with 404

3. **Concurrent Access:**
   - 100 threads hitting MongoDB simultaneously
   - Tests database performance under load
   - May cause slower response times

---

## MongoDB Storage

### What Gets Stored:

**100 Booking Documents:**
```javascript
{
  _id: ObjectId("..."),  // Unique for each
  propertyId: ObjectId("SAME_FOR_ALL"),  // Same property
  travelerId: ObjectId("SAME_FOR_ALL"),  // Same traveler account
  ownerId: ObjectId("..."),  // Property's owner
  startDate: ISODate("2025-11-25T00:00:00.000Z"),  // Same dates
  endDate: ISODate("2025-11-28T00:00:00.000Z"),    // Same dates
  guests: 2,
  totalPrice: 500,
  status: "pending"  // Initially, then "accepted" after step 5
}
```

**After Owner Accept:**
- Status changes from "pending" → "accepted" (if successful)

---

## How Owner Sees Responses

### In Real Application:
- Owner logs into dashboard
- Sees **all bookings** for their properties
- Can see 100 pending bookings (if property belongs to them)
- Can accept/reject each one

### In JMeter Test:
- Each thread simulates **one owner action**
- Thread 1 accepts booking_1
- Thread 2 accepts booking_2
- ... and so on
- All happen **concurrently** (at the same time)

---

## Summary

**100 Users = 100 Threads = 100 Bookings Created**

- ✅ All stored in MongoDB
- ✅ All use same property (first from search)
- ✅ All use same dates (7-10 days from now)
- ✅ Each owner accepts their own booking
- ⚠️ May have conflicts/errors due to overlapping dates
- ⚠️ Owner accept may fail if property ownership doesn't match

This tests:
- **Concurrent load handling**
- **Database performance**
- **API response times**
- **Error handling under stress**

