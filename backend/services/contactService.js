const { ipcMain } = require("electron");
const { ClientSchema, SupplierSchema } = require("./schemas");

function initContactService(db) {
  // Clients
  ipcMain.handle(
    "db:getClients",
    (event, { page = 1, limit = 10, search = "" }) => {
      const offset = (page - 1) * limit;
      let where = search
        ? "WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR ice LIKE ?"
        : "";
      const params = search ? Array(4).fill(`%${search}%`) : [];

      const count = db
        .prepare(`SELECT COUNT(*) as total FROM clients ${where}`)
        .get(...params);
      const data = db
        .prepare(
          `SELECT * FROM clients ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, offset);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count?.total || 0) / limit),
          totalCount: count?.total || 0,
        },
      };
    },
  );

  ipcMain.handle("db:createClient", (event, data) => {
    ClientSchema.parse(data);
    const info = db
      .prepare(
        "INSERT INTO clients (name, address, ice, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        data.name,
        data.address,
        data.ice,
        data.email,
        data.phone,
        data.notes,
      );
    return { id: info.lastInsertRowid, ...data };
  });

  ipcMain.handle("db:updateClient", (event, { id, data }) => {
    ClientSchema.parse(data);
    db.prepare(
      "UPDATE clients SET name=?, address=?, ice=?, email=?, phone=?, notes=? WHERE id=?",
    ).run(
      data.name,
      data.address,
      data.ice,
      data.email,
      data.phone,
      data.notes,
      id,
    );
    return { id, ...data };
  });

  ipcMain.handle("db:deleteClient", (event, id) => {
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    return { success: true };
  });

  // Suppliers
  ipcMain.handle(
    "db:getSuppliers",
    (event, { page = 1, limit = 10, search = "" }) => {
      const offset = (page - 1) * limit;
      let where = search
        ? "WHERE name LIKE ? OR email LIKE ? OR service_type LIKE ?"
        : "";
      const params = search ? Array(3).fill(`%${search}%`) : [];

      const count = db
        .prepare(`SELECT COUNT(*) as total FROM suppliers ${where}`)
        .get(...params);
      const data = db
        .prepare(
          `SELECT * FROM suppliers ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
        )
        .all(...params, limit, offset);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((count?.total || 0) / limit),
          totalCount: count?.total || 0,
        },
      };
    },
  );

  ipcMain.handle("db:createSupplier", (event, data) => {
    SupplierSchema.parse(data);
    const info = db
      .prepare(
        "INSERT INTO suppliers (name, service_type, contact_person, email, phone, notes) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(
        data.name,
        data.service_type,
        data.contact_person,
        data.email,
        data.phone,
        data.notes,
      );
    return { id: info.lastInsertRowid, ...data };
  });

  ipcMain.handle("db:updateSupplier", (event, { id, data }) => {
    SupplierSchema.parse(data);
    db.prepare(
      "UPDATE suppliers SET name=?, service_type=?, contact_person=?, email=?, phone=?, notes=? WHERE id=?",
    ).run(
      data.name,
      data.service_type,
      data.contact_person,
      data.email,
      data.phone,
      data.notes,
      id,
    );
    return { id, ...data };
  });

  ipcMain.handle("db:deleteSupplier", (event, id) => {
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
    return { success: true };
  });
}

module.exports = { initContactService };
