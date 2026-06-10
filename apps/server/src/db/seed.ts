import { accounts, products, users } from "@admin-kit/shared";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db } from "./client";

const email = "admin@admin-kit.local";
const password = "admin123456";

async function ensureAdmin() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  if (existing.length > 0) {
    console.log(`${email} already seeded`);
    return;
  }

  const userId = Bun.randomUUIDv7();
  const now = new Date();

  await db.insert(users).values({
    id: userId,
    name: "Admin",
    email,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(accounts).values({
    id: Bun.randomUUIDv7(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  });

  console.log(`seeded ${email} / ${password}`);
}

const SAMPLE_PRODUCTS: (typeof products.$inferInsert)[] = [
  {
    name: "Standing Desk Pro",
    description: "Dual-motor sit-stand desk, 120×70cm bamboo top",
    priceCents: 64900,
    status: "active",
  },
  {
    name: "Ergo Chair X2",
    description: "Mesh-back ergonomic chair with lumbar support",
    priceCents: 38900,
    status: "active",
  },
  {
    name: '4K Monitor 27"',
    description: "27-inch IPS, USB-C 90W passthrough",
    priceCents: 44900,
    status: "active",
  },
  {
    name: "Mechanical Keyboard TKL",
    description: "Hot-swappable, gasket mount, brown switches",
    priceCents: 12900,
    status: "active",
  },
  {
    name: "Trackball Mouse",
    description: "Wireless thumb-operated trackball",
    priceCents: 9900,
    status: "active",
  },
  {
    name: "Laptop Stand",
    description: "Aluminium riser, adjustable height",
    priceCents: 4900,
    status: "active",
  },
  {
    name: "USB-C Dock 11-in-1",
    description: "Dual HDMI, 2.5GbE, 100W PD",
    priceCents: 18900,
    status: "active",
  },
  {
    name: "Webcam 2K",
    description: "Autofocus, privacy shutter, dual mics",
    priceCents: 11900,
    status: "active",
  },
  {
    name: "Desk Mat XXL",
    description: "90×40cm vegan leather, stitched edges",
    priceCents: 3900,
    status: "active",
  },
  {
    name: "Monitor Light Bar",
    description: "Asymmetric backlight, auto-dimming",
    priceCents: 10900,
    status: "active",
  },
  {
    name: "Noise-Cancelling Headset",
    description: "Hybrid ANC, 40h battery, boom mic",
    priceCents: 27900,
    status: "active",
  },
  {
    name: "Cable Management Tray",
    description: "Under-desk steel tray, 60cm",
    priceCents: 2900,
    status: "active",
  },
  {
    name: "Footrest Pro",
    description: "Adjustable tilt, memory foam",
    priceCents: 5900,
    status: "active",
  },
  {
    name: "Whiteboard 90×60",
    description: "Magnetic glass surface, frameless",
    priceCents: 15900,
    status: "active",
  },
  {
    name: "Conference Speaker",
    description: "360° pickup, daisy-chainable",
    priceCents: 21900,
    status: "active",
  },
  {
    name: "HDMI Cable 2.1 (2m)",
    description: "8K@60Hz certified",
    priceCents: 1900,
    status: "active",
  },
  {
    name: 'CRT Monitor 17"',
    description: "Legacy stock — superseded by flat panels",
    priceCents: 2500,
    status: "archived",
  },
  {
    name: "DVD Docking Station",
    description: "Discontinued optical media dock",
    priceCents: 1500,
    status: "archived",
  },
  {
    name: "Wrist Rest (old model)",
    description: "Replaced by ergonomic v2",
    priceCents: 900,
    status: "archived",
  },
  {
    name: "VGA Adapter",
    description: "Legacy display adapter, end-of-life",
    priceCents: 700,
    status: "archived",
  },
];

async function ensureProducts() {
  const existing = await db.select({ id: products.id }).from(products).limit(1);
  if (existing.length > 0) {
    console.log("products already seeded");
    return;
  }
  await db.insert(products).values(SAMPLE_PRODUCTS);
  console.log(`seeded ${SAMPLE_PRODUCTS.length} sample products`);
}

await ensureAdmin();
await ensureProducts();
process.exit(0);
