import { Pool } from 'pg'

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:FHeFHPzxXbDOSWJHlAHkgCrcMLmEPaeF@interchange.proxy.rlwy.net:42409/railway',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Database query wrapper
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

// Initialize database with schema
export async function initDatabase() {
  try {
    const fs = require('fs')
    const path = require('path')
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    await query(schema)
    console.log('✅ Database initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

// Cargo CRUD operations
export const cargoDb = {
  // Get all cargo with optional filters
  async getAll(filters?: {
    search?: string
    country?: string
    cargoType?: string
    urgency?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    limit?: number
    offset?: number
  }) {
    let query_text = `
      SELECT * FROM cargo 
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (filters?.search) {
      query_text += ` AND (title ILIKE $${paramIndex} OR from_addr ILIKE $${paramIndex} OR to_addr ILIKE $${paramIndex} OR provider_name ILIKE $${paramIndex})`
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    if (filters?.country) {
      query_text += ` AND (from_country ILIKE $${paramIndex} OR to_country ILIKE $${paramIndex})`
      params.push(`%${filters.country}%`)
      paramIndex++
    }

    if (filters?.cargoType) {
      query_text += ` AND type = $${paramIndex}`
      params.push(filters.cargoType)
      paramIndex++
    }

    if (filters?.urgency) {
      query_text += ` AND urgency = $${paramIndex}`
      params.push(filters.urgency)
      paramIndex++
    }

    if (filters?.minPrice) {
      query_text += ` AND price >= $${paramIndex}`
      params.push(filters.minPrice)
      paramIndex++
    }

    if (filters?.maxPrice) {
      query_text += ` AND price <= $${paramIndex}`
      params.push(filters.maxPrice)
      paramIndex++
    }

    // Sorting
    switch (filters?.sortBy) {
      case 'price-low':
        query_text += ' ORDER BY price ASC'
        break
      case 'price-high':
        query_text += ' ORDER BY price DESC'
        break
      case 'weight':
        query_text += ' ORDER BY weight DESC'
        break
      case 'urgency':
        query_text += ` ORDER BY 
          CASE urgency 
            WHEN 'Urgent' THEN 4 
            WHEN 'High' THEN 3 
            WHEN 'Medium' THEN 2 
            WHEN 'Low' THEN 1 
          END DESC`
        break
      case 'oldest':
        query_text += ' ORDER BY created_ts ASC'
        break
      default:
        query_text += ' ORDER BY created_ts DESC'
    }

    if (filters?.limit) {
      query_text += ` LIMIT $${paramIndex}`
      params.push(filters.limit)
      paramIndex++
    }

    if (filters?.offset) {
      query_text += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
      paramIndex++
    }

    const result = await query(query_text, params)
    return result.rows
  },

  // Get single cargo by ID
  async getById(id: string) {
    const result = await query('SELECT * FROM cargo WHERE id = $1', [id])
    return result.rows[0] || null
  },

  // Create new cargo
  async create(cargo: any) {
    const result = await query(`
      INSERT INTO cargo (
        id, title, type, urgency, weight, volume,
        from_addr, from_country, to_addr, to_country,
        from_lat, from_lng, to_lat, to_lng,
        load_date, delivery_date, price, price_per_kg,
        provider_name, provider_status, status,
        created_ts, updated_ts, posting_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24
      ) RETURNING *
    `, [
      cargo.id, cargo.title, cargo.type, cargo.urgency, 
      cargo.weight, cargo.volume, cargo.from_addr, cargo.from_country,
      cargo.to_addr, cargo.to_country, cargo.from_lat, cargo.from_lng,
      cargo.to_lat, cargo.to_lng, cargo.load_date, cargo.delivery_date,
      cargo.price, cargo.price_per_kg, cargo.provider_name, cargo.provider_status,
      cargo.status, cargo.created_ts, cargo.updated_ts, cargo.posting_date
    ])
    return result.rows[0]
  },

  // Update cargo status
  async updateStatus(id: string, status: string) {
    const result = await query(`
      UPDATE cargo 
      SET status = $1, updated_ts = $2 
      WHERE id = $3 
      RETURNING *
    `, [status, Date.now(), id])
    return result.rows[0]
  },

  // Get count for pagination
  async getCount(filters?: any) {
    let query_text = 'SELECT COUNT(*) FROM cargo WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters?.search) {
      query_text += ` AND (title ILIKE $${paramIndex} OR from_addr ILIKE $${paramIndex} OR to_addr ILIKE $${paramIndex} OR provider_name ILIKE $${paramIndex})`
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    const result = await query(query_text, params)
    return parseInt(result.rows[0].count)
  }
}

// Offer requests CRUD operations
export const offerDb = {
  // Get offers by cargo ID
  async getByCargoId(cargoId: string) {
    const result = await query(
      'SELECT * FROM offer_requests WHERE cargo_id = $1 ORDER BY created_ts DESC',
      [cargoId]
    )
    return result.rows
  },

  // Create new offer request
  async create(offer: any) {
    const result = await query(`
      INSERT INTO offer_requests (
        id, cargo_id, transporter_id, proposed_price, message, status, created_ts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [
      offer.id, offer.cargo_id, offer.transporter_id,
      offer.proposed_price, offer.message, offer.status, offer.created_ts
    ])
    return result.rows[0]
  },

  // Update offer status
  async updateStatus(id: string, status: string) {
    const result = await query(
      'UPDATE offer_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )
    return result.rows[0]
  }
}

// Vehicle CRUD operations
export const vehicleDb = {
  // Get all vehicles with GPS info
  async getAll(userId?: string) {
    const result = await query(`
      SELECT 
        v.*,
        g.label as gps_label,
        g.imei as gps_imei,
        g.assigned as gps_assigned,
        CASE 
          WHEN v.gps_device_id IS NOT NULL THEN true
          ELSE false
        END as has_gps
      FROM vehicles v
      LEFT JOIN gps_devices g ON v.gps_device_id = g.id
      ORDER BY v.created_ts DESC
    `)
    return result.rows
  },

  // Get vehicle by ID
  async getById(id: string) {
    const result = await query(`
      SELECT 
        v.*,
        g.label as gps_label,
        g.imei as gps_imei,
        g.assigned as gps_assigned
      FROM vehicles v
      LEFT JOIN gps_devices g ON v.gps_device_id = g.id
      WHERE v.id = $1
    `, [id])
    return result.rows[0] || null
  },

  // Create new vehicle
  async create(vehicle: any) {
    const result = await query(`
      INSERT INTO vehicles (
        id, name, license_plate, type, capacity, status, 
        driver_name, driver_phone, fuel_type, 
        gps_device_id, last_manual_lat, last_manual_lng, last_manual_location,
        created_ts, updated_ts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING *
    `, [
      vehicle.id, vehicle.name, vehicle.license_plate, vehicle.type,
      vehicle.capacity, vehicle.status, vehicle.driver_name, vehicle.driver_phone,
      vehicle.fuel_type, vehicle.gps_device_id, vehicle.last_manual_lat,
      vehicle.last_manual_lng, vehicle.last_manual_location,
      vehicle.created_ts, vehicle.updated_ts
    ])

    // If GPS device assigned, mark it as assigned
    if (vehicle.gps_device_id) {
      await query(
        'UPDATE gps_devices SET assigned = true WHERE id = $1',
        [vehicle.gps_device_id]
      )
    }

    return result.rows[0]
  },

  // Update vehicle
  async update(id: string, vehicle: any) {
    const result = await query(`
      UPDATE vehicles SET
        name = $1, license_plate = $2, type = $3, capacity = $4,
        status = $5, driver_name = $6, driver_phone = $7, fuel_type = $8,
        gps_device_id = $9, last_manual_lat = $10, last_manual_lng = $11,
        last_manual_location = $12, updated_ts = $13
      WHERE id = $14
      RETURNING *
    `, [
      vehicle.name, vehicle.license_plate, vehicle.type, vehicle.capacity,
      vehicle.status, vehicle.driver_name, vehicle.driver_phone, vehicle.fuel_type,
      vehicle.gps_device_id, vehicle.last_manual_lat, vehicle.last_manual_lng,
      vehicle.last_manual_location, Date.now(), id
    ])
    return result.rows[0]
  },

  // Delete vehicle
  async delete(id: string) {
    // First, unassign GPS device if any
    const vehicle = await this.getById(id)
    if (vehicle?.gps_device_id) {
      await query(
        'UPDATE gps_devices SET assigned = false WHERE id = $1',
        [vehicle.gps_device_id]
      )
    }

    const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  },

  // Update manual location
  async updateManualLocation(id: string, lat: number, lng: number, location: string) {
    const result = await query(`
      UPDATE vehicles SET
        last_manual_lat = $1, last_manual_lng = $2, last_manual_location = $3, updated_ts = $4
      WHERE id = $5
      RETURNING *
    `, [lat, lng, location, Date.now(), id])
    return result.rows[0]
  }
}

// GPS Device CRUD operations
export const gpsDb = {
  // Get all GPS devices
  async getAll(freeOnly = false) {
    let query_text = 'SELECT * FROM gps_devices'
    if (freeOnly) {
      query_text += ' WHERE assigned = false'
    }
    query_text += ' ORDER BY created_ts DESC'
    
    const result = await query(query_text)
    return result.rows
  },

  // Get GPS device by ID
  async getById(id: string) {
    const result = await query('SELECT * FROM gps_devices WHERE id = $1', [id])
    return result.rows[0] || null
  },

  // Create new GPS device
  async create(device: any) {
    const result = await query(`
      INSERT INTO gps_devices (id, label, imei, api_key, assigned, created_ts, updated_ts)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      device.id, device.label, device.imei, device.api_key || null,
      false, device.created_ts, device.updated_ts
    ])
    return result.rows[0]
  },

  // Update GPS device
  async update(id: string, device: any) {
    const result = await query(`
      UPDATE gps_devices SET
        label = $1, imei = $2, api_key = $3, updated_ts = $4
      WHERE id = $5
      RETURNING *
    `, [device.label, device.imei, device.api_key, Date.now(), id])
    return result.rows[0]
  },

  // Assign GPS device to vehicle
  async assign(id: string, vehicleId: string) {
    const result = await query(`
      UPDATE gps_devices SET assigned = true, updated_ts = $1
      WHERE id = $2
      RETURNING *
    `, [Date.now(), id])
    
    // Update vehicle with GPS device ID
    await query(
      'UPDATE vehicles SET gps_device_id = $1, updated_ts = $2 WHERE id = $3',
      [id, Date.now(), vehicleId]
    )
    
    return result.rows[0]
  },

  // Unassign GPS device
  async unassign(id: string) {
    const result = await query(`
      UPDATE gps_devices SET assigned = false, updated_ts = $1
      WHERE id = $2
      RETURNING *
    `, [Date.now(), id])
    
    // Remove GPS device from vehicle
    await query(
      'UPDATE vehicles SET gps_device_id = NULL, updated_ts = $1 WHERE gps_device_id = $2',
      [Date.now(), id]
    )
    
    return result.rows[0]
  },

  // Delete GPS device
  async delete(id: string) {
    // First unassign if assigned
    await this.unassign(id)
    
    const result = await query('DELETE FROM gps_devices WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }
}

export default pool