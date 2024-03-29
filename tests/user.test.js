const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase);

test("should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Ved",
      email: "vbothikar2001@example.com",
      password: "Vedant@300",
    })
    .expect(201);

  //Assertion that database was modified
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  //Assertion about the response
  expect(response.body).toMatchObject({
    user: {
      name: "Ved",
      email: "vbothikar2001@example.com",
    },
    token: user.tokens[0].token,
  });
  expect(user.password).not.toBe("Vedant@300");
});

test("should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("should not login user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "mike@gmail.com",
      password: "vedant123",
    })
    .expect(400);
});

test("should get profile of user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("should not get profile of unauthenticated user", async () => {
  await request(app).get("/users/me").send().expect(401);
});

test("should delete account for user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("should not delete account for user", async () => {
  await request(app).delete("/users/me").send().expect(401);
});

test("should upload avatar", async () => {
  await request(app)
    .post("/users/me/avatar")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .attach("avatar", "tests/fixtures/profile-pic.jpg")
    .expect(200);

  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test("should update valid user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: "Howard",
      age: "30",
    })
    .expect(200);
  const user = await User.findById(userOneId);
  expect(user.name).toEqual("Howard");
});

test("should not update user fields", async () => {
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "pune",
    })
    .expect(400);
});
