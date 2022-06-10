import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { extendType, nonNull, objectType, stringArg } from "nexus";
import { APP_SECRET } from "../utils/auth";

export const AuthPayload = objectType({
  name: "AuthPayload",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.field("user", {
      type: "User",
    });
  },
});

export const AuthMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("signup", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        name: nonNull(stringArg()),
      },
      resolve: async (_, { email, password, name }, { prisma }) => {
        const _password = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: {
            email,
            password: _password,
            name,
          },
        });
        const token = jwt.sign({ userId: user.id }, APP_SECRET);
        return {
          token,
          user,
        };
      },
    });
    t.nonNull.field("login", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      resolve: async (_, { email, password }, { prisma }) => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new Error("No user found");
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          throw new Error("Invalid password");
        }
        const token = jwt.sign({ userId: user.id }, APP_SECRET);
        return {
          token,
          user,
        };
      },
    });
  },
});
