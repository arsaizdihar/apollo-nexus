import { extendType, intArg, nonNull, objectType } from "nexus";

export const Vote = objectType({
  name: "Vote",
  definition(t) {
    t.nonNull.field("link", { type: "Link" });
    t.nonNull.field("user", { type: "User" });
  },
});

export const VoteMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("vote", {
      type: "Vote",
      args: {
        linkId: nonNull(intArg()),
      },
      async resolve(parent, { linkId }, { prisma, userId }) {
        if (!userId) {
          throw new Error("You must be logged in to vote");
        }
        const link = await prisma.link.update({
          where: { id: linkId },
          data: { voters: { connect: { id: userId } } },
        });
        const user = await prisma.user.findUnique({
          where: { id: userId },
          rejectOnNotFound: true,
        });
        return {
          link,
          user,
        };
      },
    });
  },
});
