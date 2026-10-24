import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db.js";
import { handleDbError, requireOwnerOrAdmin, requireAdmin } from "../middleware.js";

const router = Router();

function cleanUsername(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 32);
}

// POST /api/users (Administrative user creation only - public registration uses /api/auth/register)
router.post("/", requireAdmin, async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const uName = cleanUsername(username || email.split("@")[0] + Math.floor(Math.random() * 1000));
  // User creation via public endpoint must always default to customer
  const userRole = "customer";
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: uName }] },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email or username already in use." });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username: uName,
        role: userRole,
        authProvider: "Email",
        status: "Active",
      },
    });

    return res.status(201).json({
      message: "User created successfully in PostgreSQL database via Prisma.",
      user: {
        id: newUser.userId || newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to create user");
  }
});

// GET /api/users/:userId
router.get("/:userId", requireOwnerOrAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.json({
      user: {
        id: user.userId || user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to fetch user");
  }
});

// PUT /api/users/:userId
router.put("/:userId", requireOwnerOrAdmin, async (req, res) => {
  const { userId } = req.params;
  const { email, password, username, role } = req.body;

  let hashedPassword;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (email && email !== user.email) {
      const emailExists = await prisma.user.findFirst({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use." });
      }
    }

    let uNameClean = user.username;
    if (username) {
      uNameClean = cleanUsername(username);
      if (uNameClean !== user.username) {
        const usernameExists = await prisma.user.findFirst({ where: { username: uNameClean } });
        if (usernameExists) {
          return res.status(400).json({ error: "Username already in use." });
        }
      }
    }

    const caller = (req as any).user;
    const isRequesterAdmin = caller?.role === "admin";
    
    // Only verified administrators can alter roles
    let finalRole = user.role;
    if (role && isRequesterAdmin) {
      finalRole = role === "admin" ? "admin" : "customer";
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email || user.email,
        username: uNameClean,
        password: hashedPassword || user.password,
        role: finalRole,
      },
    });

    return res.json({
      message: "User updated successfully.",
      user: {
        id: updated.userId || updated.id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to update user");
  }
});

// DELETE /api/users/:userId
router.delete("/:userId", requireOwnerOrAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await prisma.user.delete({ where: { id: user.id } });
    return res.json({
      message: "User deleted successfully.",
    });
  } catch (err) {
    return handleDbError(res, err, "Failed to delete user");
  }
});

export default router;
