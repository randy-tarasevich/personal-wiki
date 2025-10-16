import { defineMiddleware } from "astro:middleware";
import { getSession } from "./lib/auth";

const publicRoutes = [
  "/login",
  "/signup",
  "/api/login",
  "/api/logout",
  "/api/signup",
  "/landing",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return next();
  }

  const sessionToken = context.cookies.get("session")?.value;

  if (!sessionToken) {
    return context.redirect("/landing");
  }

  const session = getSession(sessionToken);

  if (!session) {
    context.cookies.delete("session", { path: "/" });
    return context.redirect("/landing");
  }

  context.locals.user = { username: session.username };

  return next();
});
