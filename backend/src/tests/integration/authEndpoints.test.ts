
import request from "supertest";
import app from "../../app";
import { User } from "../../models/userModel";
import { mockUserId } from "../factories/mockData";
import bcrypt from "bcrypt";

describe("Authentication Integration Tests", () => {
  describe("POST /api/user/register", () => {
    it("should initiate registration and send OTP", async () => {
      const response = await request(app).post("/api/user/register").send({
        name: "New User",
        email: "newuser@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Registration initiated");
      expect(response.body.data.email).toBe("newuser@example.com");

      // Check that registration token cookie was set
      expect(response.headers["set-cookie"]).toBeDefined();
      const cookies = response.headers["set-cookie"];
      const cookieString = Array.isArray(cookies)
        ? cookies.join(" ")
        : (cookies as string);
      expect(cookieString).toContain("registrationToken");
    });

    it("should reject duplicate email", async () => {
      // Create user first
      await User.create({
        email: "duplicate@example.com",
        password: await bcrypt.hash("Password123!", 10),
        name: "Existing User",
        isActive: true,
      });

      const response = await request(app).post("/api/user/register").send({
        name: "New User",
        email: "duplicate@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(409);
    });

    it("should validate email format", async () => {
      const response = await request(app).post("/api/user/register").send({
        name: "New User",
        email: "invalid-email",
        password: "Password123!",
      });

      expect(response.status).toBe(400);
    });

    it("should enforce password strength", async () => {
      const response = await request(app).post("/api/user/register").send({
        name: "New User",
        email: "test@example.com",
        password: "weak",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/user/login", () => {
    beforeEach(async () => {
      await User.create({
        email: "login@example.com",
        password: await bcrypt.hash("Password123!", 10),
        name: "Login User",
        isActive: true,
      });
    });

    it("should login with valid credentials and set cookies", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: "login@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe("login@example.com");

      // Check that auth cookies were set
      expect(response.headers["set-cookie"]).toBeDefined();
      const cookies = response.headers["set-cookie"];
      const cookieString = Array.isArray(cookies)
        ? cookies.join(" ")
        : (cookies as string);
      expect(cookieString).toContain("accessToken");
      expect(cookieString).toContain("refreshToken");
    });

    it("should reject invalid password", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: "login@example.com",
        password: "WrongPassword!",
      });

      expect(response.status).toBe(401);
    });

    it("should reject non-existent email", async () => {
      const response = await request(app).post("/api/user/login").send({
        email: "nonexistent@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/user/profile", () => {
    let loginCookies: string[];

    beforeEach(async () => {
      // Create user
      await User.create({
        _id: mockUserId,
        email: "profile@example.com",
        password: await bcrypt.hash("Password123!", 10),
        name: "Profile User",
        isActive: true,
      });

      // Login to get cookies
      const loginResponse = await request(app).post("/api/user/login").send({
        email: "profile@example.com",
        password: "Password123!",
      });

      // Ensure cookies is an array
      const cookies = loginResponse.headers["set-cookie"];
      loginCookies = Array.isArray(cookies)
        ? cookies
        : cookies
          ? [cookies]
          : [];
    });

    it("should return user profile with valid cookies", async () => {
      const response = await request(app)
        .get("/api/user/profile")
        .set("Cookie", loginCookies);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe("profile@example.com");
    });

    it("should reject request without cookies", async () => {
      const response = await request(app).get("/api/user/profile");

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const response = await request(app)
        .get("/api/user/profile")
        .set("Cookie", ["accessToken=invalid-token"]);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/user/logout", () => {
    let loginCookies: string[];

    beforeEach(async () => {
      // Create user
      await User.create({
        _id: mockUserId,
        email: "logout@example.com",
        password: await bcrypt.hash("Password123!", 10),
        name: "Logout User",
        isActive: true,
      });

      // Login to get cookies
      const loginResponse = await request(app).post("/api/user/login").send({
        email: "logout@example.com",
        password: "Password123!",
      });

      // Ensure cookies is an array
      const cookies = loginResponse.headers["set-cookie"];
      loginCookies = Array.isArray(cookies)
        ? cookies
        : cookies
          ? [cookies]
          : [];
    });

    it("should logout successfully and clear cookies", async () => {
      const response = await request(app)
        .post("/api/user/logout")
        .set("Cookie", loginCookies);

      expect(response.status).toBe(200);

      expect(response.headers["set-cookie"]).toBeDefined();
      const cookies = response.headers["set-cookie"];
      const cookieString = Array.isArray(cookies)
        ? cookies.join(" ")
        : (cookies as string);
      expect(cookieString).toContain("accessToken=;");
      expect(cookieString).toContain("refreshToken=;");
    });
  });
});
