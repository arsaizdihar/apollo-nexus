import mapValues from "lodash.mapvalues";
import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  objectType,
  stringArg,
} from "nexus";

export const LinkOrderByInput = inputObjectType({
  name: "LinkOrderByInput",
  definition(t) {
    t.field("description", { type: "Sort" });
    t.field("url", { type: "Sort" });
    t.field("createdAt", { type: "Sort" });
  },
});

export const Sort = enumType({
  name: "Sort",
  members: ["asc", "desc"],
});

export const Link = objectType({
  name: "Link", // 1
  definition(t) {
    // 2
    t.nonNull.int("id"); // 3
    t.nonNull.string("description"); // 4
    t.nonNull.string("url"); // 5
    t.nonNull.dateTime("createdAt");
    t.field("postedBy", {
      type: "User",
      resolve(parent, args, { prisma }) {
        return prisma.link.findUnique({ where: { id: parent.id } }).postedBy();
      },
    });
    t.nonNull.list.nonNull.field("voters", {
      type: "User",
      resolve(parent, args, { prisma }) {
        return prisma.link.findUnique({ where: { id: parent.id } }).voters();
      },
    });
  },
});

export const Feed = objectType({
  name: "Feed",
  definition(t) {
    t.nonNull.list.nonNull.field("links", {
      type: "Link",
    });
    t.nonNull.int("count");
    t.id("id");
  },
});

export const LinkQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("feed", {
      type: "Feed",
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull("LinkOrderByInput")) }),
      },
      async resolve(parent, args, context, info) {
        const { filter, skip, take, orderBy } = args;
        const _orderBy = orderBy
          ?.map((order) => mapValues(order, (value) => value ?? undefined))
          .filter((order) =>
            Object.values(order).some((value) => value !== undefined)
          );

        const where = filter
          ? {
              OR: [
                { description: { contains: filter } },
                { url: { contains: filter } },
              ],
            }
          : undefined;
        const [links, count] = await Promise.all([
          context.prisma.link.findMany({
            where,
            skip: skip ?? undefined,
            take: take ?? undefined,
            orderBy: _orderBy,
          }),
          context.prisma.link.count({ where }),
        ]);
        const id = `main-feed:${JSON.stringify(args)}`;
        return { links, count, id };
      },
    });
    t.field("link", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
      },
      resolve(parent, { id }, context) {
        return context.prisma.link.findUnique({ where: { id } });
      },
    });
  },
});

export const LinkMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("post", {
      type: "Link",
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },
      resolve(parent, { description, url }, context) {
        const { userId } = context;
        if (!userId) {
          throw new Error("You must be logged in to post links");
        }
        const newLink = context.prisma.link.create({
          data: {
            description,
            url,
            postedBy: {
              connect: {
                id: userId,
              },
            },
          },
        });
        return newLink;
      },
    });
    t.nonNull.field("updateLink", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
        description: stringArg(),
        url: stringArg(),
      },
      resolve(parent, { id, description, url }, context) {
        return context.prisma.link.update({
          where: { id },
          data: {
            description: description ?? undefined,
            url: url ?? undefined,
          },
        });
      },
    });
    t.nonNull.field("deleteLink", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
      },
      resolve(parent, { id }, context) {
        return context.prisma.link.delete({ where: { id } });
      },
    });
  },
});
