const MenuItem = require("../../models/MenuItem");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");

function toDto(m) {
  return { id: m._id, name: m.name, price: m.price, on: m.on };
}

async function create(req, res, next) {
  try {
    const { name, price } = req.body;
    if (!name || !(price > 0)) throw new ApiError(400, "MISSING_FIELDS", "name and a positive price are required.");
    const item = await MenuItem.create({ ownerId: req.user.id, name, price });
    ok(res, toDto(item), 201);
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const items = await MenuItem.find({ ownerId: req.user.id }).sort({ createdAt: 1 });
    ok(res, items.map(toDto));
  } catch (err) {
    next(err);
  }
}

// Never deletes the dish or its price history (§6) — toggles `on` only.
async function toggle(req, res, next) {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!item) throw new ApiError(404, "MENU_ITEM_NOT_FOUND", "Menu item not found.");
    item.on = !item.on;
    await item.save();
    ok(res, toDto(item));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, toggle, toDto };
